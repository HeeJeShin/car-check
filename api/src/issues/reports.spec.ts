import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../auth/auth.service";
import type { PrismaService } from "../prisma/prisma.service";
import { CreateReportDto } from "./dto/report.dto";
import { ReportsService } from "./reports.service";

const admin: AuthUser = { id: 1, email: "a@x.com", name: "관리자", picture: null, role: "ADMIN" };

function fakeDb(issueStatus: string | null = "DRAFT") {
  const saved: Record<string, unknown>[] = [];
  const prisma = {
    carIssue: { findUnique: vi.fn(async () => (issueStatus ? { status: issueStatus } : null)) },
    issueReport: {
      create: vi.fn(async ({ data }) => saved.push(data)),
      findUnique: vi.fn(async ({ where }) => (where.id === 7 ? { id: 7 } : null)),
      update: vi.fn(async ({ data }) => data),
    },
  } as unknown as PrismaService;
  return { service: new ReportsService(prisma), saved, prisma };
}

describe("제보 입력 규칙 (DTO)", () => {
  const check = async (body: object) => (await validate(plainToInstance(CreateReportDto, body))).map((e) => e.property);

  it("무엇이 틀렸는지 하나 이상 골라야 하고, 없는 항목은 거절", async () => {
    expect(await check({ reasons: [] })).toContain("reasons");
    expect(await check({ reasons: ["NOPE"] })).toContain("reasons");
    expect(await check({ reasons: ["FIXED", "YEAR"] })).toEqual([]);
  });

  it("근거 링크는 주소 형식만", async () => {
    expect(await check({ reasons: ["FIXED"], sourceUrl: "그냥 글" })).toContain("sourceUrl");
    expect(await check({ reasons: ["FIXED"], sourceUrl: "https://www.car.go.kr/" })).toEqual([]);
  });
});

describe("제보 받기", () => {
  it("'기타'를 고르고 내용을 안 적으면 400", async () => {
    const { service } = fakeDb();
    await expect(service.create(1, { reasons: ["OTHER"], comment: "  " }, "1.1.1.1")).rejects.toThrow("기타");
  });

  it("없는 고질병이나 반려된 고질병에는 제보할 수 없다 (404)", async () => {
    await expect(fakeDb(null).service.create(1, { reasons: ["FIXED"] }, "1.1.1.1")).rejects.toThrow("찾을 수 없습니다");
    await expect(fakeDb("REJECTED").service.create(1, { reasons: ["FIXED"] }, "1.1.1.1")).rejects.toThrow("찾을 수 없습니다");
  });

  it("저장할 때 같은 항목은 한 번만, 내용 앞뒤 공백은 지운다", async () => {
    const { service, saved } = fakeDb();
    await service.create(3, { reasons: ["FIXED", "FIXED", "YEAR"], comment: "  22년식부터 개선  " }, "1.1.1.1");
    expect(saved[0]).toEqual({ issueId: 3, reasons: ["FIXED", "YEAR"], comment: "22년식부터 개선", sourceUrl: null });
  });

  it("한 IP가 1시간에 5건을 넘기면 429이고 저장하지 않는다, 다른 IP는 계속 된다", async () => {
    const { service, saved } = fakeDb();
    for (let i = 0; i < 5; i++) await service.create(1, { reasons: ["FIXED"] }, "1.1.1.1");
    await expect(service.create(1, { reasons: ["FIXED"] }, "1.1.1.1")).rejects.toMatchObject({ status: 429 });
    expect(saved).toHaveLength(5);
    await expect(service.create(1, { reasons: ["FIXED"] }, "2.2.2.2")).resolves.toEqual({ ok: true });
  });
});

describe("답변 달기", () => {
  it("답변과 답변한 사람·시각을 저장한다", async () => {
    const { service } = fakeDb();
    const result = await service.answer(7, { answer: "  반영했어요  " }, admin);
    expect(result).toMatchObject({ answer: "반영했어요", answeredById: 1 });
    expect(result.answeredAt).toBeInstanceOf(Date);
  });

  it("없는 제보에는 404", async () => {
    await expect(fakeDb().service.answer(99, { answer: "답변" }, admin)).rejects.toThrow("찾을 수 없습니다");
  });
});
