import { HttpException, ServiceUnavailableException } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CarsService } from "../cars/cars.service";
import { AI_LIMITS, AiService, toRecommendedCars } from "./ai.service";

const car = (id: number, displayName: string, yearFrom: number, yearTo: number | null) => ({
  id, maker: "현대", displayName, segment: "준중형 SUV", bodyType: "SUV", yearFrom, yearTo, fuels: ["GASOLINE"],
});
const candidates = [car(1, "투싼ix", 2009, 2015), car(2, "올 뉴 투싼", 2015, 2018), car(3, "디 올 뉴 투싼", 2020, null)];
const pick = (carModelId: number, yearFrom: number, yearTo: number) => ({ carModelId, yearFrom, yearTo, why: "이유", watchOut: "주의" });

function setup(env: Record<string, string>) {
  vi.stubEnv("USE_MOCK_AI", env.USE_MOCK_AI ?? "");
  vi.stubEnv("GEMINI_API_KEY", env.GEMINI_API_KEY ?? "");
  const cars = { recommendCandidates: vi.fn(async () => candidates) } as unknown as CarsService;
  return new AiService(cars);
}

afterEach(() => vi.unstubAllEnvs());

describe("AI 모드", () => {
  it("키도 목 모드도 없으면 off이고, AI 요청은 503으로 막는다", async () => {
    const ai = setup({});
    expect(ai.mode()).toBe("off");
    await expect(ai.recommend({ request: "뭐가 좋아?" }, "1.1.1.1")).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("USE_MOCK_AI=true면 키가 있어도 목 모드가 우선이다", () => {
    expect(setup({ USE_MOCK_AI: "true", GEMINI_API_KEY: "k" }).mode()).toBe("mock");
  });

  it("목 모드 추천도 등록된 세대의 번호와 연식으로 나온다", async () => {
    const ai = setup({ USE_MOCK_AI: "true" });
    const result = await ai.recommend({ request: "유지비 적은 차" }, "1.1.1.1");
    expect(result.cars.map((c) => c.id)).toEqual([1, 2, 3]);
    expect(result.cars[0]).toMatchObject({ label: "투싼ix", yearRange: "2009~2015" });
  });
});

describe("toRecommendedCars: AI가 고른 차를 DB와 맞춰 보기", () => {
  it("등록되지 않은 세대와 중복은 뺀다", () => {
    const result = toRecommendedCars([pick(99, 2015, 2016), pick(2, 2016, 2017), pick(2, 2015, 2016)], candidates);
    expect(result.map((c) => c.id)).toEqual([2]);
  });

  it("연식은 판매 기간 안으로 줄이고, 겹치지 않으면 뺀다", () => {
    const thisYear = new Date().getFullYear();
    expect(toRecommendedCars([pick(2, 2013, 2016)], candidates)[0].yearRange).toBe("2015~2016");
    expect(toRecommendedCars([pick(3, 2024, 2999)], candidates)[0].yearRange).toBe(`2024~${thisYear}`);
    expect(toRecommendedCars([pick(1, 2018, 2020)], candidates)).toEqual([]);
  });
});

describe("Gemini 모드: 캐시 + 요청 제한", () => {
  // 실제 Gemini 대신 호출 횟수만 세는 가짜 generate
  function gemini() {
    const ai = setup({ GEMINI_API_KEY: "k" });
    const answer = JSON.stringify({ summary: "요약", cars: [pick(1, 2010, 2012)] });
    const generate = vi.spyOn(ai as unknown as { generate: () => Promise<string> }, "generate").mockResolvedValue(answer);
    return { ai, generate };
  }
  const status = (p: Promise<unknown>) => p.then(() => 200, (e: HttpException) => e.getStatus());

  it("같은 질문(공백·대소문자만 다름)은 Gemini를 한 번만 부른다", async () => {
    const { ai, generate } = gemini();
    await ai.recommend({ request: "유지비 적은 차" }, "1.1.1.1");
    const again = await ai.recommend({ request: "유지비  적은차" }, "2.2.2.2");
    expect(again.summary).toBe("요약");
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("같은 질문이 동시에 들어와도 Gemini는 한 번", async () => {
    const { ai, generate } = gemini();
    await Promise.all([1, 2, 3].map(() => ai.recommend({ request: "동시에" }, "1.1.1.1")));
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("한 IP가 1분 한도를 넘으면 429, 다른 IP는 계속 된다", async () => {
    const { ai } = gemini();
    for (let i = 0; i < AI_LIMITS.perIpMinute.max; i++) await ai.recommend({ request: `질문${i}` }, "1.1.1.1");
    expect(await status(ai.recommend({ request: "하나 더" }, "1.1.1.1"))).toBe(429);
    expect(await status(ai.recommend({ request: "하나 더" }, "2.2.2.2"))).toBe(200);
  });

  it("캐시로 답한 질문은 횟수에 안 들어간다", async () => {
    const { ai } = gemini();
    for (let i = 0; i < AI_LIMITS.perIpMinute.max * 2; i++) await ai.recommend({ request: "같은 질문" }, "1.1.1.1");
    expect(await status(ai.recommend({ request: "새 질문" }, "1.1.1.1"))).toBe(200);
  });

  it("전체 1분 한도를 넘으면 IP가 달라도 429", async () => {
    const { ai } = gemini();
    for (let i = 0; i < AI_LIMITS.globalMinute.max; i++) await ai.recommend({ request: `q${i}` }, `10.0.0.${i}`);
    const err = await ai.recommend({ request: "마지막" }, "9.9.9.9").catch((e: HttpException) => e);
    expect((err as HttpException).getStatus()).toBe(429);
    expect((err as HttpException).message).toContain("몰려");
  });

  it("실패한 답은 캐시하지 않는다", async () => {
    const { ai, generate } = gemini();
    generate.mockRejectedValueOnce(new Error("일시 오류"));
    await expect(ai.recommend({ request: "재시도" }, "1.1.1.1")).rejects.toThrow();
    expect((await ai.recommend({ request: "재시도" }, "1.1.1.1")).summary).toBe("요약");
  });
});
