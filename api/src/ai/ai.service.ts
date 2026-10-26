// ─────────────────────────────────────────────────────────────
// Gemini 호출. AI는 세 가지 모드로 동작합니다(.env로 결정).
//   gemini : GEMINI_API_KEY가 있으면 실제 Gemini 호출
//   mock   : USE_MOCK_AI=true면 키 없이 샘플 답변 (가장 우선)
//   off    : 둘 다 없으면 AI 기능만 꺼짐. 나머지(차종 검색·고질병·관리)는 정상 동작
// ─────────────────────────────────────────────────────────────
import { ApiError, GoogleGenAI } from "@google/genai";
import { HttpException, HttpStatus, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { CarsService } from "../cars/cars.service";
import { AiCache, normalizeText } from "./ai-cache";
import { GuideDto, RecommendDto } from "./dto/ai.dto";
import { MOCK_GUIDE, MOCK_RECOMMEND } from "./mock-answers";
import { GUIDE_SYSTEM, RECOMMEND_SCHEMA, RECOMMEND_SYSTEM } from "./prompts";
import { type Limit, RateLimiter } from "./rate-limiter";

export type AiMode = "gemini" | "mock" | "off";

export type LinkedCar = { id: number; label: string; maker: string; name: string };
export type RecommendedCar = { name: string; yearRange: string; why: string; watchOut: string };
export type RecommendResult = {
  summary: string;
  // carModels: 추천된 차종 중 우리 DB에 고질병 정보가 있는 세대들 → 화면에서 바로 링크
  cars: (RecommendedCar & { carModels: LinkedCar[] })[];
  nextSteps: string[];
};
type AiRecommendation = { summary: string; cars: RecommendedCar[]; nextSteps: string[] };

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
// Gemini를 실제로 부르는 횟수 제한. 전체 한도는 쓰는 모델의 무료 등급 분당 한도보다 조금 낮게 잡으세요(AI Studio에서 확인).
export const AI_LIMITS = {
  perIpMinute: { max: 5, windowMs: MINUTE, label: "1분에 5번" },
  perIpDay: { max: 30, windowMs: DAY, label: "하루 30번" },
  globalMinute: { max: Number(process.env.AI_GLOBAL_PER_MIN) || 10, windowMs: MINUTE, label: "전체" },
} satisfies Record<string, Limit>;
const CACHE_TTL = DAY; // 같은 질문 답은 하루 동안 재사용
const CACHE_MAX = 500; // 질문 500개까지 저장. 넘으면 오래 안 쓴 것부터 지움

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client?: GoogleGenAI;
  private readonly guideCache = new AiCache<string>(CACHE_TTL, CACHE_MAX);
  private readonly recommendCache = new AiCache<AiRecommendation>(CACHE_TTL, CACHE_MAX);
  private readonly limiter = new RateLimiter();
  private calls = 0;

  constructor(private readonly cars: CarsService) {}

  mode(): AiMode {
    if (process.env.USE_MOCK_AI === "true") return "mock";
    if (process.env.GEMINI_API_KEY) return "gemini";
    return "off";
  }

  /** ip: 요청 제한용 (컨트롤러가 넘겨줌) */
  async guide(dto: GuideDto, ip: string): Promise<{ answer: string }> {
    const mode = this.ensureOn();
    if (mode === "mock") return { answer: MOCK_GUIDE };
    const answer = await this.guideCache.getOrCreate(normalizeText(dto.question), () => {
      this.acquire(ip);
      return this.generate(GUIDE_SYSTEM, dto.question);
    });
    return { answer };
  }

  async recommend(dto: RecommendDto, ip: string): Promise<RecommendResult> {
    const mode = this.ensureOn();
    let result: AiRecommendation;
    if (mode === "mock") {
      result = MOCK_RECOMMEND;
    } else {
      const key = [normalizeText(dto.purpose), dto.budgetManwon, dto.passengers ?? "", normalizeText(dto.notes ?? "")].join("|");
      result = await this.recommendCache.getOrCreate(key, () => {
        this.acquire(ip);
        return this.askRecommend(dto);
      });
    }
    // AI가 추천한 차종 이름을 우리 DB와 연결 → "이 차의 고질병 보기" 링크
    // (캐시에는 AI 답만 저장하고, 연결은 매번 새로 해서 DB에 차종이 추가되면 바로 반영)
    const models = await this.cars.findAll();
    return { ...result, cars: result.cars.map((car) => ({ ...car, carModels: linkCar(car.name, models) })) };
  }

  private async askRecommend(dto: RecommendDto): Promise<AiRecommendation> {
    const prompt = [
      `용도: ${dto.purpose}`,
      `예산: ${dto.budgetManwon}만원`,
      dto.passengers && `주로 타는 인원: ${dto.passengers}명`,
      dto.notes && `기타: ${dto.notes}`,
    ]
      .filter(Boolean)
      .join("\n");
    const text = await this.generate(RECOMMEND_SYSTEM, prompt, RECOMMEND_SCHEMA);
    try {
      return JSON.parse(text);
    } catch {
      throw new HttpException("AI 응답을 해석하지 못했습니다. 다시 시도해주세요.", HttpStatus.BAD_GATEWAY);
    }
  }

  /** Gemini를 부르기 직전에 제한 확인. 넘었으면 429. */
  private acquire(ip: string) {
    if (++this.calls % 100 === 0) this.limiter.prune(DAY);
    const blocked = this.limiter.tryAcquire([
      { key: `ip:${ip}`, limit: AI_LIMITS.perIpMinute },
      { key: `ip-day:${ip}`, limit: AI_LIMITS.perIpDay },
      { key: "global", limit: AI_LIMITS.globalMinute },
    ]);
    if (!blocked) return;
    const wait = blocked.retryAfterSec >= 3600 ? `${Math.ceil(blocked.retryAfterSec / 3600)}시간` : `${blocked.retryAfterSec}초`;
    const message =
      blocked.label === "전체"
        ? `지금 AI 질문이 몰려 있어요. ${wait} 뒤에 다시 시도해주세요.`
        : `AI 질문은 ${blocked.label}까지 할 수 있어요. ${wait} 뒤에 다시 시도해주세요.`;
    throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
  }

  private ensureOn(): Exclude<AiMode, "off"> {
    const mode = this.mode();
    if (mode === "off") {
      // 503: 서버는 살아 있지만 이 기능은 지금 쓸 수 없음
      throw new ServiceUnavailableException("AI 기능이 꺼져 있습니다. .env에 GEMINI_API_KEY를 넣거나 USE_MOCK_AI=true로 바꾸세요.");
    }
    return mode;
  }

  private async generate(systemInstruction: string, contents: string, schema?: object): Promise<string> {
    // 클라이언트는 처음 쓸 때 만듭니다. 키가 없어도 서버가 뜰 수 있게.
    this.client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
      const response = await this.client.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-flash-latest",
        contents,
        config: {
          systemInstruction,
          ...(schema && { responseMimeType: "application/json", responseJsonSchema: schema }),
        },
      });
      const text = response.text;
      if (!text) throw new HttpException("AI가 빈 답변을 돌려줬습니다.", HttpStatus.BAD_GATEWAY);
      return text;
    } catch (err) {
      // 에러 종류별로 구분해서 사용자에게 알맞은 메시지를 줍니다(문자열 비교 X, 상태코드로).
      if (err instanceof ApiError) {
        this.logger.warn(`Gemini API ${err.status}: ${err.message}`);
        if (err.status === 429) {
          throw new HttpException("무료 할당량을 다 썼어요. 잠시 후(또는 내일) 다시 시도해주세요.", HttpStatus.TOO_MANY_REQUESTS);
        }
        if (err.status === 400 || err.status === 401 || err.status === 403) {
          throw new HttpException("Gemini 설정(API 키·모델 이름)을 확인해주세요.", HttpStatus.BAD_GATEWAY);
        }
        throw new HttpException("AI 서버 오류입니다. 잠시 후 다시 시도해주세요.", HttpStatus.BAD_GATEWAY);
      }
      throw err;
    }
  }
}

const normalize = (s: string) => s.toLowerCase().replace(/\s/g, "");

/**
 * AI가 말한 차종 이름 → 우리 DB의 차종(세대)들.
 * AI는 "올뉴 투싼", "기아 K5"처럼 다양하게 쓰므로 이름·별칭이 포함되는지로 느슨하게 맞춥니다.
 */
export function linkCar(
  name: string,
  models: { id: number; maker: string; name: string; displayName: string; yearFrom: number; yearTo: number | null; aliases: string[] }[],
): LinkedCar[] {
  const target = normalize(name);
  return models
    .filter((m) => [m.name, m.displayName, ...m.aliases].some((n) => n && target.includes(normalize(n))))
    .map((m) => ({ id: m.id, maker: m.maker, name: m.name, label: `${m.displayName} (${m.yearFrom}~${m.yearTo ?? "현재"})` }));
}
