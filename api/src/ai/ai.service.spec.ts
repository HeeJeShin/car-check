import { HttpException, ServiceUnavailableException } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CarsService } from "../cars/cars.service";
import { AI_LIMITS, AiService, linkCar } from "./ai.service";

const models = [
  { id: 1, maker: "현대", name: "투싼", displayName: "투싼ix", yearFrom: 2009, yearTo: 2015, aliases: ["ix35", "tucson"] },
  { id: 2, maker: "현대", name: "투싼", displayName: "올 뉴 투싼", yearFrom: 2015, yearTo: 2018, aliases: ["tucson"] },
  { id: 3, maker: "기아", name: "K5", displayName: "K5 1세대", yearFrom: 2010, yearTo: 2015, aliases: ["k5"] },
  { id: 4, maker: "BMW", name: "5시리즈", displayName: "5시리즈 F10", yearFrom: 2010, yearTo: null, aliases: ["520d"] },
];
const ids = (linked: { id: number }[]) => linked.map((l) => l.id);

function setup(env: Record<string, string>) {
  vi.stubEnv("USE_MOCK_AI", env.USE_MOCK_AI ?? "");
  vi.stubEnv("GEMINI_API_KEY", env.GEMINI_API_KEY ?? "");
  const cars = { findAll: vi.fn(async () => models) } as unknown as CarsService;
  return new AiService(cars);
}

afterEach(() => vi.unstubAllEnvs());

describe("AI 모드", () => {
  it("키도 목 모드도 없으면 off이고, AI 요청은 503으로 막는다", async () => {
    const ai = setup({});
    expect(ai.mode()).toBe("off");
    await expect(ai.guide({ question: "뭐부터?" }, "1.1.1.1")).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("USE_MOCK_AI=true면 키가 있어도 목 모드가 우선이다", () => {
    expect(setup({ USE_MOCK_AI: "true", GEMINI_API_KEY: "k" }).mode()).toBe("mock");
  });

  it("목 모드 추천은 DB에 있는 차종과 연결된다", async () => {
    const ai = setup({ USE_MOCK_AI: "true" });
    const result = await ai.recommend({ purpose: "출퇴근", budgetManwon: 1500 }, "1.1.1.1");
    const tucson = result.cars.find((c) => c.name === "투싼");
    expect(ids(tucson!.carModels)).toEqual([1, 2]);
    expect(tucson!.carModels[0].label).toBe("투싼ix (2009~2015)");
  });
});

describe("linkCar: AI가 말한 차종 이름 → DB 차종", () => {
  it("띄어쓰기·브랜드가 붙어도 찾는다", () => {
    expect(ids(linkCar("기아 K5", models))).toEqual([3]);
    expect(ids(linkCar("올뉴 투싼", models))).toEqual([1, 2]);
    expect(ids(linkCar("BMW 520d", models))).toEqual([4]);
  });

  it("DB에 없는 차종은 빈 배열", () => {
    expect(linkCar("아반떼", models)).toEqual([]);
  });
});

describe("Gemini 모드: 캐시 + 요청 제한", () => {
  // 실제 Gemini 대신 호출 횟수만 세는 가짜 generate
  function gemini() {
    const ai = setup({ GEMINI_API_KEY: "k" });
    const generate = vi.spyOn(ai as unknown as { generate: () => Promise<string> }, "generate").mockResolvedValue("답변");
    return { ai, generate };
  }
  const status = (p: Promise<unknown>) => p.then(() => 200, (e: HttpException) => e.getStatus());

  it("같은 질문(공백·대소문자만 다름)은 Gemini를 한 번만 부른다", async () => {
    const { ai, generate } = gemini();
    await ai.guide({ question: "첫 차 뭐부터?" }, "1.1.1.1");
    const again = await ai.guide({ question: "첫차  뭐부터" }, "2.2.2.2");
    expect(again.answer).toBe("답변");
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("같은 질문이 동시에 들어와도 Gemini는 한 번", async () => {
    const { ai, generate } = gemini();
    await Promise.all([1, 2, 3].map(() => ai.guide({ question: "동시에" }, "1.1.1.1")));
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("한 IP가 1분 한도를 넘으면 429, 다른 IP는 계속 된다", async () => {
    const { ai } = gemini();
    for (let i = 0; i < AI_LIMITS.perIpMinute.max; i++) await ai.guide({ question: `질문${i}` }, "1.1.1.1");
    expect(await status(ai.guide({ question: "하나 더" }, "1.1.1.1"))).toBe(429);
    expect(await status(ai.guide({ question: "하나 더" }, "2.2.2.2"))).toBe(200);
  });

  it("캐시로 답한 질문은 횟수에 안 들어간다", async () => {
    const { ai } = gemini();
    for (let i = 0; i < AI_LIMITS.perIpMinute.max * 2; i++) await ai.guide({ question: "같은 질문" }, "1.1.1.1");
    expect(await status(ai.guide({ question: "새 질문" }, "1.1.1.1"))).toBe(200);
  });

  it("전체 1분 한도를 넘으면 IP가 달라도 429", async () => {
    const { ai } = gemini();
    for (let i = 0; i < AI_LIMITS.globalMinute.max; i++) await ai.guide({ question: `q${i}` }, `10.0.0.${i}`);
    const err = await ai.guide({ question: "마지막" }, "9.9.9.9").catch((e: HttpException) => e);
    expect((err as HttpException).getStatus()).toBe(429);
    expect((err as HttpException).message).toContain("몰려");
  });

  it("실패한 답은 캐시하지 않는다", async () => {
    const { ai, generate } = gemini();
    generate.mockRejectedValueOnce(new Error("일시 오류"));
    await expect(ai.guide({ question: "재시도" }, "1.1.1.1")).rejects.toThrow();
    expect((await ai.guide({ question: "재시도" }, "1.1.1.1")).answer).toBe("답변");
  });
});
