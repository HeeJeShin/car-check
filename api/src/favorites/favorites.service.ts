// 내 차량(즐겨찾기). 연식 기준이라 세대(CarModel) 단위로 담습니다.
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PUBLIC_STATUSES } from "../issues/issues.service";
import { PrismaService } from "../prisma/prisma.service";

export const MAX_FAVORITES = 50;

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /** 최근에 담은 차부터. 고질병 개수는 사용자 화면에 보이는 것만 셉니다(반려 제외). */
  async list(userId: number) {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        carModel: {
          select: {
            id: true,
            maker: true,
            name: true,
            displayName: true,
            yearFrom: true,
            yearTo: true,
            _count: { select: { issues: { where: { status: { in: PUBLIC_STATUSES } } } } },
          },
        },
      },
    });
    return rows.map(({ createdAt, carModel: { _count, ...car } }) => ({ ...car, issueCount: _count.issues, savedAt: createdAt }));
  }

  /** 이미 담긴 차를 다시 담아도 그대로 성공합니다(두 번 눌러도 안전). */
  async add(userId: number, carModelId: number) {
    const key = { userId_carModelId: { userId, carModelId } };
    if (await this.prisma.favorite.findUnique({ where: key })) return;
    if (!(await this.prisma.carModel.findUnique({ where: { id: carModelId }, select: { id: true } }))) {
      throw new NotFoundException("없는 차종입니다.");
    }
    if ((await this.prisma.favorite.count({ where: { userId } })) >= MAX_FAVORITES) {
      throw new BadRequestException(`내 차량은 ${MAX_FAVORITES}대까지 담을 수 있어요.`);
    }
    await this.prisma.favorite.upsert({ where: key, create: { userId, carModelId }, update: {} });
  }

  async remove(userId: number, carModelId: number) {
    await this.prisma.favorite.deleteMany({ where: { userId, carModelId } });
  }
}
