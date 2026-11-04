import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../prisma/prisma.service";
import { CarsService, sortIssues } from "./cars.service";
import { EV_CHECKS } from "./ev-checks";

describe("sortIssues", () => {
  it("검증된 것 먼저, 그 안에서 심각한 것 먼저", () => {
    const issues = [
      { id: 1, status: "DRAFT", severity: "HIGH" },
      { id: 2, status: "VERIFIED", severity: "LOW" },
      { id: 3, status: "VERIFIED", severity: "HIGH" },
      { id: 4, status: "DRAFT", severity: "MEDIUM" },
    ] as const;
    expect(sortIssues([...issues]).map((i) => i.id)).toEqual([3, 2, 1, 4]);
  });
});

describe("매장 점검 가이드의 전기차 점검", () => {
  const car = (fuels: string[]) => ({
    id: 1, maker: "현대", name: "차", displayName: "차", yearFrom: 2021, yearTo: null,
    powertrains: fuels.map((fuel, i) => ({ id: i, engine: "엔진", fuel, transmission: fuel === "EV" ? "REDUCER" : "AT", gearbox: null, drive: null })),
  });
  const service = (fuels: string[]) =>
    new CarsService({
      carModel: { findUnique: vi.fn(async () => car(fuels)) },
      inspectionPoint: { findMany: vi.fn(async () => []) },
    } as unknown as PrismaService);

  it("전기차 엔진이 있으면 차 밑 배터리·SOH 점검 목록을 준다", async () => {
    const result = await service(["EV"]).inspection(1);
    expect(result.evChecks).toEqual(EV_CHECKS);
    expect(result.evChecks[0].title).toContain("리프트");
  });

  it("전기차가 아니면 빈 목록", async () => {
    expect((await service(["GASOLINE"]).inspection(1)).evChecks).toEqual([]);
  });
});
