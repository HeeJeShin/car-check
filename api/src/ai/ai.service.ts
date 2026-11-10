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
import { RecommendDto } from "./dto/ai.dto";
import { mockRecommendation } from "./mock-answers";
import { RECOMMEND_SCHEMA, RECOMMEND_SYSTEM } from "./prompts";
import { type Limit, RateLimiter } from "./rate-limiter";

export type AiMode = "gemini" | "mock" | "off";

/** AI에게 넘기는 후보: 등록된 세대 하나 (CarsService.recommendCandidates) */
export type RecommendCandidate = {
  id: number;
  maker: string;
  displayName: string;
  segment: string | null;
  bodyType: string;
  yearFrom: number;
  yearTo: number | null;
  fuels: string[];
};
type AiCarPick = { carModelId: number; yearFrom: number; yearTo: number; why: string; watchOut: string };
export type AiRecommendation = { summary: string; cars: AiCarPick[] };
export type RecommendedCar = { id: number; maker: string; label: string; yearRange: string; why: string; watchOut: string };
export type RecommendResult = { summary: string; cars: RecommendedCar[] };

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
const MAX_RECOMMENDED = 5;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client?: GoogleGenAI;
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
  async recommend(dto: RecommendDto, ip: string): Promise<RecommendResult> {
    const mode = this.ensureOn();
    const candidates = await this.cars.recommendCandidates();
    const answer =
      mode === "mock"
        ? mockRecommendation(candidates)
        : await this.recommendCache.getOrCreate(normalizeText(dto.request), () => {
            this.acquire(ip);
            return this.askRecommend(dto, candidates);
          });
    // AI 답은 그대로 믿지 않고 DB와 맞춰 봅니다. 캐시에는 AI 답만 저장해서, 차종이 바뀌면 바로 반영됩니다.
    return { summary: answer.summary, cars: toRecommendedCars(answer.cars, candidates) };
  }

  private async askRecommend(dto: RecommendDto, candidates: RecommendCandidate[]): Promise<AiRecommendation> {
    const list = candidates
      .map((c) => [c.id, `${c.maker} ${c.displayName}`, c.segment ?? "-", c.bodyType, `${c.yearFrom}~${c.yearTo ?? "현재"}`, c.fuels.join("/")].join(" | "))
      .join("\n");
    // 사용자 입력은 contents로만 보내 규칙·목록(systemInstruction)과 섞이지 않게 합니다.
    const text = await this.generate(`${RECOMMEND_SYSTEM}\n\n등록된 차 (번호 | 차 | 차급 | 종류 | 판매 연식 | 연료):\n${list}`, dto.request, RECOMMEND_SCHEMA);
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

/**
 * AI가 고른 차 → 화면에 보여줄 추천.
 * 등록되지 않은 세대와 중복은 빼고, 연식은 그 세대의 판매 기간 안으로 줄입니다(겹치는 연식이 없으면 뺌).
 */
export function toRecommendedCars(picks: AiCarPick[], candidates: RecommendCandidate[]): RecommendedCar[] {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const seen = new Set<number>();
  const thisYear = new Date().getFullYear();
  return picks
    .flatMap((pick) => {
      const car = byId.get(pick.carModelId);
      if (!car || seen.has(car.id)) return [];
      const from = Math.max(pick.yearFrom, car.yearFrom);
      const to = Math.min(pick.yearTo, car.yearTo ?? thisYear);
      if (from > to) return [];
      seen.add(car.id);
      const yearRange = from === to ? `${from}` : `${from}~${to}`;
      return [{ id: car.id, maker: car.maker, label: car.displayName, yearRange, why: pick.why, watchOut: pick.watchOut }];
    })
    .slice(0, MAX_RECOMMENDED);
}
