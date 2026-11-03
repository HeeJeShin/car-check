// ─────────────────────────────────────────────────────────────
// 사용자 제보("틀린 내용 있어요")와 운영자 답변.
//   - 제보는 로그인 없이 받습니다. 대신 IP당 1시간 5건·하루 20건으로 도배를 막습니다(AI 질문과 같은 RateLimiter).
//   - 답변이 달린 제보만 사용자 화면에 공개합니다(cars.service.ts의 PUBLIC_REPORTS). 답변 전에는 개수만 보여요.
//   - 제보는 고질병 상태를 바꾸지 않습니다. 운영자가 읽고 필요하면 심사 흐름(issue-workflow.ts)으로 고칩니다.
// ─────────────────────────────────────────────────────────────
import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { type Limit, RateLimiter } from "../ai/rate-limiter";
import type { AuthUser } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { AnswerReportDto, CreateReportDto } from "./dto/report.dto";
import { PUBLIC_STATUSES } from "./issues.service";

const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;

export const REPORT_LIMITS = {
  perIpHour: { max: 5, windowMs: HOUR, label: "1시간에 5건" },
  perIpDay: { max: 20, windowMs: DAY, label: "하루 20건" },
} satisfies Record<string, Limit>;

@Injectable()
export class ReportsService {
  private readonly limiter = new RateLimiter();
  private calls = 0;

  constructor(private readonly prisma: PrismaService) {}

  /** 제보 받기. 반려되어 사용자 화면에 없는 고질병에는 제보할 수 없습니다. */
  async create(issueId: number, dto: CreateReportDto, ip: string) {
    const comment = dto.comment?.trim() || null;
    if (dto.reasons.includes("OTHER") && !comment) throw new BadRequestException("'기타'를 고르면 어떤 내용이 틀렸는지 적어주세요.");

    const issue = await this.prisma.carIssue.findUnique({ where: { id: issueId }, select: { status: true } });
    if (!issue || !PUBLIC_STATUSES.includes(issue.status)) throw new NotFoundException(`고질병 ${issueId}번을 찾을 수 없습니다.`);

    this.acquire(ip);
    await this.prisma.issueReport.create({
      data: { issueId, reasons: [...new Set(dto.reasons)], comment, sourceUrl: dto.sourceUrl ?? null },
    });
    return { ok: true };
  }

  /** 관리 화면 제보함: 답변 안 한 것 먼저, 최근 순 */
  listForAdmin() {
    return this.prisma.issueReport.findMany({
      orderBy: [{ answeredAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
      take: 100,
      include: {
        issue: { select: { id: true, title: true, carModel: { select: { id: true, displayName: true, yearFrom: true, yearTo: true } } } },
        answeredBy: { select: { name: true } },
      },
    });
  }

  /** 답변 달기(고치기도 같은 요청). 답변이 달리면 사용자 화면에 공개됩니다. */
  async answer(reportId: number, dto: AnswerReportDto, user: AuthUser) {
    const exists = await this.prisma.issueReport.findUnique({ where: { id: reportId }, select: { id: true } });
    if (!exists) throw new NotFoundException(`제보 ${reportId}번을 찾을 수 없습니다.`);
    return this.prisma.issueReport.update({
      where: { id: reportId },
      data: { answer: dto.answer.trim(), answeredAt: new Date(), answeredById: user.id },
    });
  }

  /** 제보 직전에 IP당 제한 확인. 넘었으면 429. */
  private acquire(ip: string) {
    if (++this.calls % 100 === 0) this.limiter.prune(DAY);
    const blocked = this.limiter.tryAcquire([
      { key: `report:${ip}`, limit: REPORT_LIMITS.perIpHour },
      { key: `report-day:${ip}`, limit: REPORT_LIMITS.perIpDay },
    ]);
    if (!blocked) return;
    const wait = blocked.retryAfterSec >= 3600 ? `${Math.ceil(blocked.retryAfterSec / 3600)}시간` : `${Math.ceil(blocked.retryAfterSec / 60)}분`;
    throw new HttpException(`제보는 ${blocked.label}까지 보낼 수 있어요. ${wait} 뒤에 다시 보내주세요.`, HttpStatus.TOO_MANY_REQUESTS);
  }
}
