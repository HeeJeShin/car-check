// ─────────────────────────────────────────────────────────────
// AI 요청 제한. Gemini를 실제로 부를 때만 셉니다 (캐시로 답한 요청·샘플 모드는 안 셈).
//   - IP별: 한 사람이 버튼을 연타하거나 스크립트로 반복 호출하는 것 막기
//   - 전체: 접속자가 몰려도 무료 할당량(분당 요청 수)을 넘지 않게 서버 전체 합계로 막기
// 서버 메모리에 기록 → 서버를 여러 대로 늘리면 Redis 같은 공용 저장소로 옮겨야 합니다.
// ─────────────────────────────────────────────────────────────

export type Limit = { max: number; windowMs: number; label: string };

export class RateLimiter {
  // 키(예: "ip:1.2.3.4") → 요청 시각들
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly now: () => number = Date.now) {}

  /**
   * 제한 안이면 기록하고 null, 넘었으면 몇 초 뒤에 다시 되는지 돌려줍니다.
   * 여러 제한 중 하나라도 넘으면 아무것도 기록하지 않습니다(막힌 요청은 횟수에 안 들어감).
   */
  tryAcquire(checks: { key: string; limit: Limit }[]): { label: string; retryAfterSec: number } | null {
    const now = this.now();
    for (const { key, limit } of checks) {
      const recent = this.recent(key, limit.windowMs, now);
      if (recent.length >= limit.max) {
        return { label: limit.label, retryAfterSec: Math.ceil((recent[0] + limit.windowMs - now) / 1000) };
      }
    }
    for (const { key } of checks) {
      const list = this.hits.get(key) ?? [];
      list.push(now);
      this.hits.set(key, list);
    }
    return null;
  }

  // 창(window) 밖으로 나간 기록은 지우면서 남은 것만 돌려줍니다.
  private recent(key: string, windowMs: number, now: number) {
    const list = (this.hits.get(key) ?? []).filter((t) => t > now - windowMs);
    if (list.length) this.hits.set(key, list);
    else this.hits.delete(key);
    return list;
  }

  /** 오래된 기록 정리. 접속한 IP가 많아도 메모리가 계속 늘지 않게 주기적으로 부릅니다. */
  prune(maxWindowMs: number) {
    const now = this.now();
    for (const key of [...this.hits.keys()]) this.recent(key, maxWindowMs, now);
  }
}
