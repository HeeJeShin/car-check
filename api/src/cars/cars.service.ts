import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCarModelDto } from "./dto/create-car-model.dto";
import { GENERAL_CHECKS } from "./general-checks";

@Injectable()
export class CarsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.carModel.findMany({
      orderBy: [{ maker: "asc" }, { name: "asc" }, { yearFrom: "asc" }],
      include: { _count: { select: { issues: true } } },
    });
  }

  /**
   * "투싼" + 2015 → 그 해에 팔린 투싼 세대들.
   * ⚠️ 결과가 여러 개일 수 있습니다(2015 투싼 = 구형 LM, 신형 TL). 그땐 화면에서 사용자에게 고르게 합니다.
   */
  search(q: string, year?: number) {
    const keyword = q.trim();
    return this.prisma.carModel.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: keyword, mode: "insensitive" } },
              // 별칭은 소문자·공백 없이 저장해 두고, 검색어도 같은 모양으로 맞춰 비교합니다.
              { aliases: { has: keyword.toLowerCase().replace(/\s/g, "") } },
            ],
          },
          // 연식이 주어지면 "그 해가 판매 기간 안에 있는" 세대만. yearTo가 null이면 현재 판매 중.
          ...(year ? [{ yearFrom: { lte: year } }, { OR: [{ yearTo: null }, { yearTo: { gte: year } }] }] : []),
        ],
      },
      orderBy: { yearFrom: "asc" },
      include: { _count: { select: { issues: true } } },
    });
  }

  async findOne(id: number) {
    const car = await this.prisma.carModel.findUnique({
      where: { id },
      include: { issues: true },
    });
    if (!car) throw new NotFoundException(`차종 ${id}번을 찾을 수 없습니다.`);
    return { ...car, issues: sortIssues(car.issues), generalChecks: GENERAL_CHECKS };
  }

  create(dto: CreateCarModelDto) {
    return this.prisma.carModel.create({
      data: { ...dto, aliases: (dto.aliases ?? []).map((a) => a.toLowerCase().replace(/\s/g, "")) },
    });
  }
}

const SEVERITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

/** 검증된 것 먼저, 그다음 심각한 것 먼저. 사용자가 "믿을 만하고 중요한 것"부터 보게 합니다. */
export function sortIssues<T extends { status: "DRAFT" | "VERIFIED"; severity: keyof typeof SEVERITY_ORDER }>(issues: T[]) {
  return [...issues].sort(
    (a, b) =>
      (a.status === "VERIFIED" ? 0 : 1) - (b.status === "VERIFIED" ? 0 : 1) ||
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}
