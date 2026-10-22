import { ServiceUnavailableException } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CarsService } from "../cars/cars.service";
import { AiService, linkCar } from "./ai.service";

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
    await expect(ai.guide({ question: "뭐부터?" })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("USE_MOCK_AI=true면 키가 있어도 목 모드가 우선이다", () => {
    expect(setup({ USE_MOCK_AI: "true", GEMINI_API_KEY: "k" }).mode()).toBe("mock");
  });

  it("목 모드 추천은 DB에 있는 차종과 연결된다", async () => {
    const ai = setup({ USE_MOCK_AI: "true" });
    const result = await ai.recommend({ purpose: "출퇴근", budgetManwon: 1500 });
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
