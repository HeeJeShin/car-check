import { BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../auth/auth.service";
import type { PrismaService } from "../prisma/prisma.service";
import { TRANSITIONS, availableTransitions, findTransition } from "./issue-workflow";
import { IssuesService, diff } from "./issues.service";

const admin: AuthUser = { id: 1, email: "a@x.com", name: "관리자", picture: null, role: "ADMIN" };
const editor: AuthUser = { id: 2, email: "e@x.com", name: "에디터", picture: null, role: "EDITOR" };

describe("심사 흐름 표", () => {
  // [from, to, 허용되는 역할]. 여기에 없는 조합은 전부 거절되어야 합니다.
  const allowed: [string, string, string[]][] = [
    ["DRAFT", "IN_REVIEW", ["ADMIN", "EDITOR"]],
    ["IN_REVIEW", "DRAFT", ["ADMIN", "EDITOR"]],
    ["IN_REVIEW", "VERIFIED", ["ADMIN"]],
    ["IN_REVIEW", "REJECTED", ["ADMIN"]],
    ["REJECTED", "DRAFT", ["ADMIN", "EDITOR"]],
    ["VERIFIED", "DRAFT", ["ADMIN"]],
  ];
  const STATUSES = ["DRAFT", "IN_REVIEW", "VERIFIED", "REJECTED"] as const;

  it("허용 표와 정확히 같다 (그 밖의 전이는 없음)", () => {
    expect(TRANSITIONS.map((t) => [t.from, t.to, t.roles])).toEqual(allowed);
  });

  it("초안에서 검증됨 직행, 반려에서 검증됨 직행 같은 전이는 없다", () => {
    for (const from of STATUSES) for (const to of STATUSES) {
      const ok = allowed.some(([f, t]) => f === from && t === to);
      expect(Boolean(findTransition(from, to)), `${from}→${to}`).toBe(ok);
    }
  });

  it("에디터에게는 승인·반려·검증 취소 버튼이 없다", () => {
    expect(availableTransitions("IN_REVIEW", "EDITOR").map((t) => t.to)).toEqual(["DRAFT"]);
    expect(availableTransitions("VERIFIED", "EDITOR")).toEqual([]);
    expect(availableTransitions("IN_REVIEW", "ADMIN").map((t) => t.to)).toEqual(["DRAFT", "VERIFIED", "REJECTED"]);
  });
});

// 트랜잭션을 흉내 내는 가짜 DB: $transaction 안에서 에러가 나면 그 안의 쓰기를 전부 버립니다(롤백).
function fakeDb(issue: { id: number; status: string; sourceUrl?: string | null; title?: string; updatedAt?: Date }) {
  const state = { issue: { title: "제목", sourceUrl: null, updatedAt: new Date(0), ...issue }, history: [] as Record<string, unknown>[] };
  let racing = false; // true면 "다른 사람이 먼저 바꾼" 상황
  const tx = {
    carIssue: {
      updateMany: vi.fn(async ({ where, data }) => {
        const statusOk = typeof where.status === "string" ? where.status === state.issue.status : where.status.in.includes(state.issue.status);
        const timeOk = !where.updatedAt || where.updatedAt.getTime() === state.issue.updatedAt.getTime();
        if (racing || !statusOk || !timeOk) return { count: 0 };
        Object.assign(state.issue, data, { updatedAt: new Date() });
        return { count: 1 };
      }),
      findUniqueOrThrow: vi.fn(async () => ({ ...state.issue })),
      create: vi.fn(),
    },
    issueHistory: { create: vi.fn(async ({ data }) => state.history.push(data)) },
  };
  const prisma = {
    carIssue: { findUnique: vi.fn(async () => ({ ...state.issue })) },
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => {
      const snapshot = structuredClone(state);
      try {
        return await fn(tx);
      } catch (e) {
        Object.assign(state, snapshot);
        throw e;
      }
    }),
  } as unknown as PrismaService;
  return { service: new IssuesService(prisma), state, race: () => (racing = true) };
}

describe("상태 전이 (트랜잭션 + 이력)", () => {
  it("승인하면 상태와 이력이 같이 저장된다", async () => {
    const { service, state } = fakeDb({ id: 1, status: "IN_REVIEW", sourceUrl: "https://src" });
    await service.transition(1, { to: "VERIFIED" }, admin);
    expect(state.issue.status).toBe("VERIFIED");
    expect(state.history).toEqual([expect.objectContaining({ action: "STATUS_CHANGED", fromStatus: "IN_REVIEW", toStatus: "VERIFIED", userId: 1 })]);
  });

  it("초안에서 검증됨 직행은 400, 에디터 승인은 403, 사유 없는 반려·출처 없는 승인은 400", async () => {
    await expect(fakeDb({ id: 1, status: "DRAFT" }).service.transition(1, { to: "VERIFIED", sourceUrl: "https://x" }, admin)).rejects.toBeInstanceOf(BadRequestException);
    await expect(fakeDb({ id: 1, status: "IN_REVIEW", sourceUrl: "https://x" }).service.transition(1, { to: "VERIFIED" }, editor)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(fakeDb({ id: 1, status: "IN_REVIEW" }).service.transition(1, { to: "REJECTED", reason: "  " }, admin)).rejects.toBeInstanceOf(BadRequestException);
    await expect(fakeDb({ id: 1, status: "IN_REVIEW" }).service.transition(1, { to: "VERIFIED" }, admin)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("이미 그 상태로 바뀌어 있으면(늦게 누른 쪽) 409", async () => {
    await expect(fakeDb({ id: 1, status: "VERIFIED" }).service.transition(1, { to: "VERIFIED" }, admin)).rejects.toBeInstanceOf(ConflictException);
  });

  it("반려 사유는 이력에 남는다", async () => {
    const { service, state } = fakeDb({ id: 1, status: "IN_REVIEW" });
    await service.transition(1, { to: "REJECTED", reason: " 근거 부족 " }, admin);
    expect(state.history[0]).toMatchObject({ toStatus: "REJECTED", reason: "근거 부족" });
  });

  it("다른 사람이 먼저 바꿨으면 409이고, 상태도 이력도 저장되지 않는다", async () => {
    const { service, state, race } = fakeDb({ id: 1, status: "IN_REVIEW", sourceUrl: "https://src" });
    race();
    await expect(service.transition(1, { to: "VERIFIED" }, admin)).rejects.toBeInstanceOf(ConflictException);
    expect(state.issue.status).toBe("IN_REVIEW");
    expect(state.history).toEqual([]);
  });
});

describe("내용 수정", () => {
  it("초안은 고칠 수 있고, 바뀐 칸만 [전, 후]로 이력에 남는다", async () => {
    const { service, state } = fakeDb({ id: 1, status: "DRAFT", title: "옛 제목" });
    await service.update(1, { title: "새 제목", severity: undefined }, editor);
    expect(state.issue.title).toBe("새 제목");
    expect(state.history[0]).toMatchObject({ action: "UPDATED", changes: { title: ["옛 제목", "새 제목"] }, userId: 2 });
  });

  it("검토 중·검증된 정보는 관리자도 바로 못 고친다 (409)", async () => {
    await expect(fakeDb({ id: 1, status: "IN_REVIEW" }).service.update(1, { title: "x" }, admin)).rejects.toBeInstanceOf(ConflictException);
    await expect(fakeDb({ id: 1, status: "VERIFIED" }).service.update(1, { title: "x" }, admin)).rejects.toBeInstanceOf(ConflictException);
  });

  it("같은 값을 다시 보내면 이력을 남기지 않는다", async () => {
    const { service, state } = fakeDb({ id: 1, status: "DRAFT", title: "제목" });
    await service.update(1, { title: "제목" }, admin);
    expect(state.history).toEqual([]);
  });

  it("diff: 바뀐 칸만, 빈 값(undefined)은 무시", () => {
    expect(diff({ title: "a", note: null }, { title: "b", note: undefined, engine: "1.6" })).toEqual({ title: ["a", "b"], engine: [null, "1.6"] });
  });
});
