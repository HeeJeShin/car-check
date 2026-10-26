import { Injectable, NotFoundException } from "@nestjs/common";
import { PUBLIC_STATUSES } from "../issues/issues.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCarModelDto } from "./dto/create-car-model.dto";
import { GENERAL_CHECKS } from "./general-checks";
import { TRANSMISSION_GUIDE, driveSteps, powertrainTips } from "./powertrain-tips";

const normalize = (s: string) => s.toLowerCase().replace(/\s/g, "");

@Injectable()
export class CarsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 관리 화면·AI 추천 연결용: 세대 전체 */
  findAll() {
    return this.prisma.carModel.findMany({
      orderBy: [{ maker: "asc" }, { name: "asc" }, { yearFrom: "asc" }],
      include: { _count: { select: { issues: true } } },
    });
  }

  /**
   * "차종 선택" 화면: 세대를 차 이름 단위로 묶은 카드 목록.
   * 세대들을 한 번에 가져와 코드에서 이름별로 묶습니다. 차종이 늘어도 쿼리는 1번입니다.
   */
  async models() {
    const rows = await this.prisma.carModel.findMany({
      orderBy: [{ maker: "asc" }, { name: "asc" }, { yearFrom: "desc" }],
      select: { maker: true, name: true, segment: true, bodyType: true, aliases: true },
    });
    const map = new Map<string, { maker: string; name: string; segment: string | null; bodyType: string; aliases: string[]; generations: number }>();
    for (const r of rows) {
      const key = `${r.maker}/${r.name}`;
      const cur = map.get(key);
      if (cur) {
        cur.generations += 1;
        cur.aliases.push(...r.aliases);
      } else {
        // 최신 세대(yearFrom desc 첫 행)의 차급·차 종류를 대표로 씁니다.
        map.set(key, { maker: r.maker, name: r.name, segment: r.segment, bodyType: r.bodyType, aliases: [...r.aliases], generations: 1 });
      }
    }
    return [...map.values()].map((m) => ({ ...m, aliases: [...new Set(m.aliases)] }));
  }

  /** "세대·연식 선택" 화면: 한 차종의 세대들 (최신 먼저) */
  generations(maker: string, name: string) {
    return this.prisma.carModel.findMany({
      where: { maker, name },
      orderBy: { yearFrom: "desc" },
      include: { _count: { select: { issues: { where: { status: { in: PUBLIC_STATUSES } } } } } },
    });
  }

  /** 이름·별칭·세대 이름 + 연식으로 찾기. 결과가 여러 개면 화면에서 사용자에게 고르게 합니다. */
  search(q: string, year?: number) {
    const keyword = q.trim();
    return this.prisma.carModel.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: keyword, mode: "insensitive" } },
              { displayName: { contains: keyword, mode: "insensitive" } },
              { aliases: { has: normalize(keyword) } },
            ],
          },
          // 연식이 주어지면 "그 해가 판매 기간 안에 있는" 세대만. yearTo가 null이면 현재 판매 중.
          ...(year ? [{ yearFrom: { lte: year } }, { OR: [{ yearTo: null }, { yearTo: { gte: year } }] }] : []),
        ],
      },
      orderBy: { yearFrom: "asc" },
      include: { _count: { select: { issues: { where: { status: { in: PUBLIC_STATUSES } } } } } },
    });
  }

  /** "고질병 리포트" 화면 */
  async findOne(id: number) {
    const car = await this.prisma.carModel.findUnique({
      where: { id },
      // 반려된 고질병은 사용자 화면에서 숨깁니다(관리 화면은 GET /issues로 전부 봄).
      include: { issues: { where: { status: { in: PUBLIC_STATUSES } } }, powertrains: { orderBy: { id: "asc" } } },
    });
    if (!car) throw new NotFoundException(`차종 ${id}번을 찾을 수 없습니다.`);
    return {
      ...car,
      issues: sortIssues(car.issues),
      tips: powertrainTips(car.powertrains),
      generalChecks: GENERAL_CHECKS,
    };
  }

  /** "매장 점검 가이드" 화면: 스펙 주의점 + 본넷 포인트(공통 + 이 차) + 시운전 */
  async inspection(id: number) {
    const car = await this.prisma.carModel.findUnique({
      where: { id },
      include: { powertrains: { orderBy: { id: "asc" } } },
    });
    if (!car) throw new NotFoundException(`차종 ${id}번을 찾을 수 없습니다.`);
    // 전기차만 있는 세대면 엔진오일·벨트 같은 내연기관 전용 포인트는 뺍니다.
    const evOnly = car.powertrains.length > 0 && car.powertrains.every((p) => p.fuel === "EV");
    const points = await this.prisma.inspectionPoint.findMany({
      where: { OR: [{ carModelId: null }, { carModelId: id }], ...(evOnly && { iceOnly: false }) },
    });
    // 공통 포인트 먼저, 그다음 이 차만의 포인트. 화면 번호는 이 순서대로 1, 2, 3 …
    const ordered = [...points].sort(
      (a, b) => (a.carModelId === null ? 0 : 1) - (b.carModelId === null ? 0 : 1) || a.order - b.order,
    );
    const mine = new Set(car.powertrains.map((p) => p.transmission));
    return {
      car: { id: car.id, maker: car.maker, name: car.name, displayName: car.displayName, yearFrom: car.yearFrom, yearTo: car.yearTo },
      powertrains: car.powertrains,
      tips: powertrainTips(car.powertrains),
      points: ordered.map((p, i) => ({ ...p, no: i + 1, mine: p.carModelId !== null })),
      driveSteps: driveSteps(car.powertrains),
      transmissionGuide: TRANSMISSION_GUIDE.map((g) => ({ ...g, mine: mine.has(g.transmission) })),
    };
  }

  create(dto: CreateCarModelDto) {
    const { powertrains, aliases, ...rest } = dto;
    return this.prisma.carModel.create({
      data: {
        ...rest,
        aliases: (aliases ?? []).map(normalize),
        powertrains: powertrains?.length ? { create: powertrains } : undefined,
      },
      include: { powertrains: true },
    });
  }
}

const SEVERITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

/** 검증된 것 먼저, 그다음 심각한 것 먼저. 사용자가 "믿을 만하고 중요한 것"부터 보게 합니다. */
export function sortIssues<T extends { status: string; severity: keyof typeof SEVERITY_ORDER }>(issues: T[]) {
  return [...issues].sort(
    (a, b) =>
      (a.status === "VERIFIED" ? 0 : 1) - (b.status === "VERIFIED" ? 0 : 1) ||
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}
