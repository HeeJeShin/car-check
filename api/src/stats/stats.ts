// ─────────────────────────────────────────────────────────────
// 방문 통계: 화면을 볼 때마다 브라우저가 POST /stats/view로 알려주고, 관리 화면이 GET /stats로 차트를 그립니다.
//   - IP는 저장하지 않습니다. "날짜 + IP + 브라우저 + 비밀값"의 해시만 남겨 그날 같은 사람인지만 셉니다.
//   - 검색엔진 로봇·미리보기 봇, 관리 화면(/admin)은 세지 않습니다.
//   - 도배 방지: IP당 1분 120건까지만 받고, 넘으면 조용히 버립니다(화면에는 영향 없음).
// ─────────────────────────────────────────────────────────────
import { createHash } from "node:crypto";
import { Body, Controller, Get, Headers, HttpCode, Injectable, Ip, Module, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { RateLimiter } from "../ai/rate-limiter";
import { Public, Roles } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const KST = 9 * 60 * MINUTE; // 날짜는 한국 시간 기준

// 검색엔진·링크 미리보기·모니터링 봇. 사람이 아닌 방문은 세지 않음
// (네이버 Yeti·다음 Daumoa는 이름에 bot이 없어 따로 넣음)
const BOT = /bot|crawl|spider|slurp|yeti|daumoa|facebookexternalhit|preview|monitor|curl|wget|python-requests|headlesschrome/i;

export class ViewDto {
  @ApiProperty({ example: "/cars/226" })
  @IsString()
  @MaxLength(300)
  @Matches(/^\//, { message: "path는 /로 시작해야 합니다." })
  path: string;

  @ApiPropertyOptional({ example: "https://search.naver.com/search.naver?query=..." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;
}

/** 한국 시간 날짜 "2026-11-04" */
export const kstDay = (date: Date) => new Date(date.getTime() + KST).toISOString().slice(0, 10);

/** 그날 같은 사람인지만 알 수 있는 값. 원래 IP는 되살릴 수 없고, 날이 바뀌면 값도 바뀜 */
export const visitorHash = (day: string, ip: string, userAgent: string, secret: string) =>
  createHash("sha256").update(`${day}|${ip}|${userAgent}|${secret}`).digest("hex").slice(0, 16);

export const isBot = (userAgent: string | undefined) => !userAgent || BOT.test(userAgent);

/** 쿼리·해시를 뺀 주소, 그리고 리포트·점검 가이드면 세대 id */
export function parsePath(raw: string) {
  const path = raw.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const car = path.match(/^\/cars\/(\d+)(?:\/inspect)?$/);
  return { path, carModelId: car ? Number(car[1]) : null };
}

/** 들어온 곳의 도메인만. 우리 사이트 안에서 이동했거나 주소가 이상하면 null */
export function referrerHost(raw: string | undefined, ownHosts: string[]) {
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    return ownHosts.includes(host) ? null : host;
  } catch {
    return null;
  }
}

const ownHosts = () =>
  (process.env.WEB_ORIGIN ?? "http://localhost:3201")
    .split(",")
    .map((o) => {
      try {
        return new URL(o.trim()).hostname.replace(/^www\./, "");
      } catch {
        return "";
      }
    })
    .filter(Boolean);

@Injectable()
export class StatsService {
  private readonly limiter = new RateLimiter();
  private calls = 0;

  constructor(private readonly prisma: PrismaService) {}

  /** 방문 한 건 기록. 세지 않는 방문(봇·관리 화면·도배)은 조용히 넘어감 */
  async record(dto: ViewDto, ip: string, userAgent: string | undefined, now = new Date()) {
    if (isBot(userAgent)) return;
    const { path, carModelId } = parsePath(dto.path);
    if (path.startsWith("/admin")) return;
    if (++this.calls % 500 === 0) this.limiter.prune(MINUTE);
    if (this.limiter.tryAcquire([{ key: `view:${ip}`, limit: { max: 120, windowMs: MINUTE, label: "1분 120건" } }])) return;

    const secret = process.env.STATS_SALT || process.env.AUTH_JWT_SECRET || "dev-stats-salt";
    await this.prisma.pageView.create({
      data: {
        path,
        carModelId,
        referrer: referrerHost(dto.referrer, ownHosts()),
        device: /Mobi|Android|iPhone|iPad/i.test(userAgent!) ? "mobile" : "desktop",
        visitorHash: visitorHash(kstDay(now), ip, userAgent!, secret),
        createdAt: now,
      },
    });
  }

  /** 관리 화면 차트: 최근 N일 일별 방문, 많이 본 차종, 유입 경로, 기기 */
  async summary(days: number, now = new Date()) {
    // 오늘 포함 N일 (한국 시간 자정부터)
    const todayStart = new Date(Date.parse(`${kstDay(now)}T00:00:00Z`) - KST);
    const since = new Date(todayStart.getTime() - (days - 1) * DAY);
    const where = { createdAt: { gte: since } };

    // 동시에 시작해 두고 하나씩 기다림 (groupBy는 Promise.all 안에서 타입 추론이 깨져서)
    const dailyQ = this.prisma.$queryRaw<{ day: string; views: number; visitors: number }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') AS day,
             count(*)::int AS views, count(DISTINCT "visitorHash")::int AS visitors
      FROM "PageView" WHERE "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1`;
    const carsQ = this.prisma.pageView.groupBy({
      by: ["carModelId"],
      where: { ...where, carModelId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { carModelId: "desc" } },
      take: 10,
    });
    const referrersQ = this.prisma.pageView.groupBy({ by: ["referrer"], where, _count: { _all: true } });
    const devicesQ = this.prisma.pageView.groupBy({ by: ["device"], where, _count: { _all: true } });
    const reportsQ = this.prisma.issueReport.count({ where });
    const [dailyRows, cars, referrers, devices, reports] = [await dailyQ, await carsQ, await referrersQ, await devicesQ, await reportsQ];

    // 방문이 없던 날도 0으로 채워 차트가 끊기지 않게
    const byDay = new Map(dailyRows.map((r) => [r.day, r]));
    const daily = Array.from({ length: days }, (_, i) => {
      const day = kstDay(new Date(since.getTime() + i * DAY));
      const row = byDay.get(day);
      return { day, views: row?.views ?? 0, visitors: row?.visitors ?? 0 };
    });

    const carInfo = await this.prisma.carModel.findMany({
      where: { id: { in: cars.map((c) => c.carModelId!) } },
      select: { id: true, maker: true, displayName: true, yearFrom: true, yearTo: true },
    });
    const carById = new Map(carInfo.map((c) => [c.id, c]));

    return {
      days,
      totals: {
        views: daily.reduce((s, d) => s + d.views, 0),
        visitors: daily.reduce((s, d) => s + d.visitors, 0), // 하루 기준 방문자를 더한 값
        reports,
      },
      daily,
      topCars: cars
        .filter((c) => carById.has(c.carModelId!)) // 지워진 차종은 뺌
        .map((c) => ({ ...carById.get(c.carModelId!)!, views: c._count._all })),
      referrers: referrers
        .map((r) => ({ host: r.referrer ?? "바로 들어옴", views: r._count._all }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8),
      devices: Object.fromEntries(devices.map((d) => [d.device, d._count._all])) as Record<string, number>,
    };
  }
}

@ApiTags("stats")
@ApiBearerAuth()
@Controller("stats")
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Post("view") // 화면을 볼 때마다 (로그인 없이). 응답 본문 없음
  @Public()
  @HttpCode(204)
  async view(@Body() dto: ViewDto, @Ip() ip: string, @Headers("user-agent") userAgent: string | undefined) {
    await this.stats.record(dto, ip, userAgent);
  }

  @Get() // 관리 화면 방문 통계: GET /stats?days=30
  @Roles("ADMIN", "EDITOR")
  @ApiQuery({ name: "days", required: false, example: 30 })
  summary(@Query("days") days?: string) {
    const n = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;
    return this.stats.summary(n);
  }
}

@Module({ controllers: [StatsController], providers: [StatsService] })
export class StatsModule {}
