// ─────────────────────────────────────────────────────────────
// AI 답변 캐시. 같은 질문이면 Gemini를 다시 부르지 않고 저장해 둔 답을 돌려줍니다.
//   - 키: 질문을 정규화한 문자열 (대소문자·공백 차이는 같은 질문으로 봄)
//   - 같은 질문이 동시에 여러 개 들어오면 Gemini는 한 번만 부르고 결과를 나눠 씁니다.
//   - 서버 메모리에 저장 → 서버를 다시 켜면 비워집니다. 서버를 여러 대로 늘리면 Redis로 옮기세요.
// ─────────────────────────────────────────────────────────────

export class AiCache<T> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();
  private readonly inFlight = new Map<string, Promise<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= this.now()) {
      this.store.delete(key);
      return undefined;
    }
    // 최근에 쓴 것을 뒤로 → 꽉 찼을 때 오래 안 쓴 것부터 지웁니다(LRU).
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.value;
  }

  /** 캐시에 있으면 그 값, 같은 키를 이미 만드는 중이면 그 결과를 기다림, 아니면 make()로 새로 만듦. */
  async getOrCreate(key: string, make: () => Promise<T>): Promise<T> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const promise = make()
      .then((value) => {
        this.set(key, value);
        return value;
      })
      .finally(() => this.inFlight.delete(key)); // 실패한 답은 저장하지 않음 → 다음 요청이 다시 시도
    this.inFlight.set(key, promise);
    return promise;
  }

  private set(key: string, value: T) {
    this.store.delete(key);
    this.store.set(key, { value, expiresAt: this.now() + this.ttlMs });
    while (this.store.size > this.maxEntries) this.store.delete(this.store.keys().next().value!);
  }
}

/** 캐시 키용 정규화: 대소문자·공백·문장부호 차이는 같은 질문으로 봅니다. */
export const normalizeText = (s: string) => s.toLowerCase().replace(/[\s.,!?~·]+/g, "");
