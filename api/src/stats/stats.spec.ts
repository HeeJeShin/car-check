import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../prisma/prisma.service";
import { StatsService, isBot, kstDay, parsePath, referrerHost, visitorHash } from "./stats";

const PHONE = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36";
const PC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

function fakeDb() {
  const saved: Record<string, unknown>[] = [];
  const prisma = { pageView: { create: vi.fn(async ({ data }) => saved.push(data)) } } as unknown as PrismaService;
  return { service: new StatsService(prisma), saved };
}

describe("방문 기록 도우미", () => {
  it("날짜는 한국 시간 기준 (UTC 15시 = 다음 날 0시)", () => {
    expect(kstDay(new Date("2026-11-03T14:59:59Z"))).toBe("2026-11-03");
    expect(kstDay(new Date("2026-11-03T15:00:00Z"))).toBe("2026-11-04");
  });

  it("방문자 값에는 IP가 그대로 들어가지 않고, 같은 날 같은 사람은 같은 값, 날이 바뀌면 다른 값", () => {
    const a = visitorHash("2026-11-04", "1.2.3.4", PHONE, "salt");
    expect(a).not.toContain("1.2.3.4");
    expect(a).toHaveLength(16);
    expect(visitorHash("2026-11-04", "1.2.3.4", PHONE, "salt")).toBe(a);
    expect(visitorHash("2026-11-05", "1.2.3.4", PHONE, "salt")).not.toBe(a);
  });

  it("검색엔진·미리보기 봇과 브라우저 정보가 없는 요청은 봇으로 본다", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)")).toBe(true); // 네이버 로봇 (이름에 bot이 없음)
    expect(isBot("Mozilla/5.0 (compatible; Daumoa/4.0)")).toBe(true); // 다음 로봇
    expect(isBot(undefined)).toBe(true);
    expect(isBot(PHONE)).toBe(false);
  });

  it("주소에서 쿼리를 빼고, 리포트·점검 가이드면 세대 id를 뽑는다", () => {
    expect(parsePath("/cars/226?from=search#issues")).toEqual({ path: "/cars/226", carModelId: 226 });
    expect(parsePath("/cars/226/inspect")).toEqual({ path: "/cars/226/inspect", carModelId: 226 });
    expect(parsePath("/cars")).toEqual({ path: "/cars", carModelId: null });
    expect(parsePath("/")).toEqual({ path: "/", carModelId: null });
  });

  it("들어온 곳은 도메인만 남기고, 우리 사이트 안 이동은 null", () => {
    const own = ["car-check-fawn-zeta.vercel.app"];
    expect(referrerHost("https://search.naver.com/search.naver?query=그랜저+고질병", own)).toBe("search.naver.com");
    expect(referrerHost("https://www.google.com/", own)).toBe("google.com");
    expect(referrerHost("https://car-check-fawn-zeta.vercel.app/cars", own)).toBeNull();
    expect(referrerHost("이상한 값", own)).toBeNull();
  });
});

describe("방문 기록 저장", () => {
  it("사람 방문은 저장: 세대 id·기기·유입 도메인·해시 (IP는 없음)", async () => {
    const { service, saved } = fakeDb();
    await service.record({ path: "/cars/226", referrer: "https://search.naver.com/x" }, "1.2.3.4", PHONE, new Date("2026-11-04T01:00:00Z"));
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ path: "/cars/226", carModelId: 226, device: "mobile", referrer: "search.naver.com" });
    expect(JSON.stringify(saved[0])).not.toContain("1.2.3.4");
  });

  it("봇·관리 화면은 저장하지 않는다", async () => {
    const { service, saved } = fakeDb();
    await service.record({ path: "/cars/1" }, "1.1.1.1", "Googlebot/2.1", new Date());
    await service.record({ path: "/admin" }, "1.1.1.1", PC, new Date());
    expect(saved).toHaveLength(0);
  });

  it("한 IP가 1분에 120건을 넘기면 나머지는 조용히 버린다 (에러 없음)", async () => {
    const { service, saved } = fakeDb();
    for (let i = 0; i < 125; i++) await service.record({ path: "/cars" }, "9.9.9.9", PC, new Date());
    expect(saved).toHaveLength(120);
  });
});
