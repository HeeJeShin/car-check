// ─────────────────────────────────────────────────────────────
// 고질병 작성·수정·심사. 모든 변경은 이력(IssueHistory)과 함께 "하나의 트랜잭션"으로 저장합니다.
//   → 상태는 바뀌었는데 이력이 없거나, 이력만 있고 상태는 그대로인 경우가 생기지 않습니다.
//
// 동시성: 두 관리자가 같은 고질병을 동시에 승인·반려하면?
//   "지금 상태가 내가 본 상태(from)일 때만 바꿔라"(updateMany where status = from)로 조건부 업데이트합니다.
//   먼저 들어온 쪽만 1건이 바뀌고, 늦은 쪽은 0건 → 409로 "다른 사람이 먼저 바꿨어요"를 돌려줍니다.
//   내용 수정도 같은 방식으로 updatedAt(마지막 수정 시각)을 조건에 넣어, 남의 수정을 덮어쓰지 않게 합니다.
// ─────────────────────────────────────────────────────────────
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.service";
import type { CarIssue, IssueStatus } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateIssueDto, TransitionDto, UpdateIssueDto } from "./dto/create-issue.dto";
import { EDITABLE, STATUS_LABEL, availableTransitions, findTransition } from "./issue-workflow";

const CONFLICT = "다른 사람이 먼저 바꿨어요. 새로고침한 뒤 다시 시도해주세요.";

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  /** 관리 화면: 한 차종의 고질병 전부(반려 포함) + 이력 + 이 사람이 누를 수 있는 버튼 */
  async listForAdmin(carModelId: number, user: AuthUser) {
    const issues = await this.prisma.carIssue.findMany({
      where: { carModelId },
      orderBy: { id: "asc" },
      include: { history: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } } } } },
    });
    return issues.map((issue) => ({
      ...issue,
      editable: EDITABLE.includes(issue.status),
      actions: availableTransitions(issue.status, user.role).map(({ to, label, needs }) => ({ to, label, needs: needs ?? null })),
    }));
  }

  async create(dto: CreateIssueDto, user: AuthUser) {
    await this.ensureCar(dto.carModelId);
    return this.prisma.$transaction(async (tx) => {
      const issue = await tx.carIssue.create({ data: { ...dto, status: "DRAFT" } });
      await tx.issueHistory.create({ data: { issueId: issue.id, action: "CREATED", toStatus: "DRAFT", userId: user.id } });
      return issue;
    });
  }

  async update(id: number, dto: UpdateIssueDto, user: AuthUser) {
    const issue = await this.find(id);
    if (!EDITABLE.includes(issue.status)) {
      throw new ConflictException(`${STATUS_LABEL[issue.status]} 상태에서는 내용을 고칠 수 없습니다. 초안으로 되돌린 뒤 고쳐주세요.`);
    }
    const changes = diff(issue, dto);
    if (Object.keys(changes).length === 0) return issue;

    return this.prisma.$transaction(async (tx) => {
      // 내가 읽은 뒤로 아무도 안 바꿨을 때만(updatedAt이 그대로일 때만) 저장
      const { count } = await tx.carIssue.updateMany({ where: { id, updatedAt: issue.updatedAt, status: { in: EDITABLE } }, data: dto });
      if (count === 0) throw new ConflictException(CONFLICT);
      await tx.issueHistory.create({ data: { issueId: id, action: "UPDATED", changes, userId: user.id } });
      return tx.carIssue.findUniqueOrThrow({ where: { id } });
    });
  }

  /** 상태 전이: 표(issue-workflow.ts)에 있는 것만, 그 역할만, 필요한 사유·출처가 있을 때만 */
  async transition(id: number, dto: TransitionDto, user: AuthUser) {
    const issue = await this.find(id);
    // 이미 그 상태면: 대개 다른 사람이 방금 먼저 같은 버튼을 누른 경우
    if (issue.status === dto.to) throw new ConflictException(`이미 ${STATUS_LABEL[dto.to]} 상태예요. 다른 사람이 먼저 바꿨을 수 있으니 새로고침해주세요.`);
    const rule = findTransition(issue.status, dto.to);
    if (!rule) throw new BadRequestException(`${STATUS_LABEL[issue.status]}에서 ${STATUS_LABEL[dto.to]}(으)로 바로 바꿀 수 없습니다.`);
    if (!rule.roles.includes(user.role)) throw new ForbiddenException(`'${rule.label}'은(는) 관리자(ADMIN)만 할 수 있습니다.`);
    if (rule.needs === "reason" && !dto.reason?.trim()) throw new BadRequestException(`'${rule.label}'에는 사유가 필요합니다.`);
    const sourceUrl = dto.sourceUrl ?? issue.sourceUrl;
    if (rule.needs === "sourceUrl" && !sourceUrl) throw new BadRequestException("승인(검증됨)하려면 출처(sourceUrl)가 필요합니다.");

    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.carIssue.updateMany({
        where: { id, status: issue.status }, // 내가 본 상태 그대로일 때만
        data: { status: dto.to, ...(dto.sourceUrl && { sourceUrl: dto.sourceUrl }) },
      });
      if (count === 0) throw new ConflictException(CONFLICT);
      await tx.issueHistory.create({
        data: { issueId: id, action: "STATUS_CHANGED", fromStatus: issue.status, toStatus: dto.to, reason: dto.reason?.trim() || null, userId: user.id },
      });
      return tx.carIssue.findUniqueOrThrow({ where: { id } });
    });
  }

  /** 삭제는 ADMIN만(컨트롤러). 이력도 같이 지워지니, 틀린 정보는 삭제보다 반려를 권장합니다. */
  async remove(id: number) {
    await this.find(id);
    await this.prisma.carIssue.delete({ where: { id } });
  }

  private async find(id: number) {
    const issue = await this.prisma.carIssue.findUnique({ where: { id } });
    if (!issue) throw new NotFoundException(`고질병 ${id}번을 찾을 수 없습니다.`);
    return issue;
  }

  private async ensureCar(carModelId: number) {
    const car = await this.prisma.carModel.findUnique({ where: { id: carModelId } });
    if (!car) throw new NotFoundException(`차종 ${carModelId}번을 찾을 수 없습니다.`);
  }
}

/** 실제로 바뀐 칸만 { 칸: [전, 후] }로. 같은 값을 다시 보낸 칸은 이력에 남기지 않습니다. */
export function diff(before: Partial<CarIssue>, patch: object) {
  const changes: Record<string, [string | null, string | null]> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const prev = before[key as keyof CarIssue] ?? null;
    if (prev !== value) changes[key] = [prev as string | null, value as string | null];
  }
  return changes;
}

/** 사용자 화면(리포트)에 보여줄 상태. 반려된 정보는 숨깁니다. */
export const PUBLIC_STATUSES: IssueStatus[] = ["DRAFT", "IN_REVIEW", "VERIFIED"];
