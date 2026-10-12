import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateIssueDto, UpdateIssueDto } from "./dto/create-issue.dto";

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIssueDto) {
    await this.ensureCar(dto.carModelId);
    assertVerifiable(dto.status, dto.sourceUrl);
    return this.prisma.carIssue.create({ data: dto });
  }

  async update(id: number, dto: UpdateIssueDto) {
    const issue = await this.prisma.carIssue.findUnique({ where: { id } });
    if (!issue) throw new NotFoundException(`고질병 ${id}번을 찾을 수 없습니다.`);
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

/** "검증됨"은 출처가 있어야만. 규칙을 화면이 아니라 서버에 두면 어떤 경로로 들어와도 지켜집니다. */
export function assertVerifiable(status: string | undefined, sourceUrl: string | null | undefined) {
  if (status === "VERIFIED" && !sourceUrl) {
    throw new BadRequestException("검증됨으로 바꾸려면 출처(sourceUrl)가 필요합니다.");
  }
}
