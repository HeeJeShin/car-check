import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateIssueDto, UpdateIssueDto } from "./dto/create-issue.dto";

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIssueDto, user: AuthUser) {
    await this.ensureCar(dto.carModelId);
    assertCanEdit(user, { nextStatus: dto.status });
    assertVerifiable(dto.status, dto.sourceUrl);
    return this.prisma.carIssue.create({ data: dto });
  }

  async update(id: number, dto: UpdateIssueDto, user: AuthUser) {
    const issue = await this.prisma.carIssue.findUnique({ where: { id } });
    if (!issue) throw new NotFoundException(`고질병 ${id}번을 찾을 수 없습니다.`);
    assertCanEdit(user, { currentStatus: issue.status, nextStatus: dto.status });
    if (dto.carModelId) await this.ensureCar(dto.carModelId);
    assertVerifiable(dto.status ?? issue.status, dto.sourceUrl ?? issue.sourceUrl);
    return this.prisma.carIssue.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const issue = await this.prisma.carIssue.findUnique({ where: { id } });
    if (!issue) throw new NotFoundException(`고질병 ${id}번을 찾을 수 없습니다.`);
    await this.prisma.carIssue.delete({ where: { id } });
  }

  private async ensureCar(carModelId: number) {
    const car = await this.prisma.carModel.findUnique({ where: { id: carModelId } });
    if (!car) throw new NotFoundException(`차종 ${carModelId}번을 찾을 수 없습니다.`);
  }
}

/**
 * 에디터(EDITOR)는 초안만 다룹니다. "검증됨"으로 바꾸거나, 이미 검증된 정보를 고칠 수 없습니다.
 * 화면에서 버튼을 숨기는 것과 별개로 서버에서 막아야 API를 직접 불러도 지켜집니다.
 */
export function assertCanEdit(user: Pick<AuthUser, "role">, s: { currentStatus?: string; nextStatus?: string }) {
  if (user.role === "ADMIN") return;
  if (s.nextStatus === "VERIFIED") throw new ForbiddenException("'검증됨' 처리는 관리자(ADMIN)만 할 수 있습니다.");
  if (s.currentStatus === "VERIFIED") throw new ForbiddenException("검증된 정보는 관리자(ADMIN)만 고칠 수 있습니다.");
}

/** "검증됨"은 출처가 있어야만. 규칙을 화면이 아니라 서버에 두면 어떤 경로로 들어와도 지켜집니다. */
export function assertVerifiable(status: string | undefined, sourceUrl: string | null | undefined) {
  if (status === "VERIFIED" && !sourceUrl) {
    throw new BadRequestException("검증됨으로 바꾸려면 출처(sourceUrl)가 필요합니다.");
  }
}
