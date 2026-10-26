import { describe, expect, it } from "vitest";
import { AiCache, normalizeText } from "./ai-cache";
import { RateLimiter } from "./rate-limiter";

describe("AiCache", () => {
  it("유효 기간이 지나면 다시 만든다", async () => {
    let t = 0;
    const cache = new AiCache<string>(1000, 10, () => t);
    let made = 0;
    const make = async () => `답${++made}`;
    expect(await cache.getOrCreate("k", make)).toBe("답1");
    t = 999;
    expect(await cache.getOrCreate("k", make)).toBe("답1");
    t = 1000;
    expect(await cache.getOrCreate("k", make)).toBe("답2");
  });

  it("꽉 차면 가장 오래 안 쓴 것부터 지운다", async () => {
    const cache = new AiCache<string>(60_000, 2);
    await cache.getOrCreate("a", async () => "A");
    await cache.getOrCreate("b", async () => "B");
    cache.get("a"); // a를 최근에 씀 → b가 가장 오래됨
    await cache.getOrCreate("c", async () => "C");
    expect(cache.get("a")).toBe("A");
    expect(cache.get("b")).toBeUndefined();
  });

  it("공백·대소문자·문장부호 차이는 같은 키", () => {
    expect(normalizeText("첫 차, 뭐부터?")).toBe(normalizeText("첫차 뭐부터"));
    expect(normalizeText("SUV")).toBe(normalizeText("suv"));
  });
});

describe("RateLimiter", () => {
  const perMin = { max: 2, windowMs: 60_000, label: "1분에 2번" };

  it("한도까지 허용하고, 넘으면 남은 시간을 알려주고, 시간이 지나면 다시 허용", () => {
    let t = 0;
    const limiter = new RateLimiter(() => t);
    expect(limiter.tryAcquire([{ key: "ip", limit: perMin }])).toBeNull();
    t = 10_000;
    expect(limiter.tryAcquire([{ key: "ip", limit: perMin }])).toBeNull();
    t = 20_000;
    expect(limiter.tryAcquire([{ key: "ip", limit: perMin }])).toEqual({ label: "1분에 2번", retryAfterSec: 40 });
    t = 60_001;
    expect(limiter.tryAcquire([{ key: "ip", limit: perMin }])).toBeNull();
  });

  it("여러 제한 중 하나라도 막히면 아무것도 기록하지 않는다", () => {
    const limiter = new RateLimiter(() => 0);
    const global = { max: 1, windowMs: 60_000, label: "전체" };
    expect(limiter.tryAcquire([{ key: "global", limit: global }])).toBeNull();
    expect(limiter.tryAcquire([{ key: "ip", limit: perMin }, { key: "global", limit: global }])).not.toBeNull();
    // 막힌 요청은 ip 횟수에 안 들어갔으므로 ip만 따로 보면 2번 다 남아 있음
    expect(limiter.tryAcquire([{ key: "ip", limit: perMin }])).toBeNull();
    expect(limiter.tryAcquire([{ key: "ip", limit: perMin }])).toBeNull();
  });
});
