// ─────────────────────────────────────────────────────────────
// 조회 화면(서버 컴포넌트)용 API 호출. 응답을 Next.js 서버에 저장해 두고 REVALIDATE초마다 새로 받습니다(ISR).
//   - 처음 들어온 사람: 서버가 API를 불러 화면을 만들고 저장
//   - 그다음 사람들: API를 부르지 않고 저장된 화면을 바로 받음
//   - 시간이 지나면: 일단 저장된 화면을 주고, 뒤에서 새로 만들어 교체 (기다리는 사람 없음)
//   - 관리 화면에서 데이터를 고치면 refreshPublicPages()가 바로 지워서 다음 방문 때 새로 만듭니다.
// ─────────────────────────────────────────────────────────────
import "server-only";
import { notFound } from "next/navigation";
import { ApiError, api } from "./api";

// 관리 화면 수정은 바로 반영되므로, 이 시간은 "혹시 놓친 변경"의 안전망입니다.
export const REVALIDATE = 3600;

/** 저장된 응답을 쓰는 API 호출. API가 404면 Next.js의 "없는 페이지" 화면으로 보냅니다. */
export async function cachedApi<T>(path: string): Promise<T> {
  try {
    return await api<T>(path, { next: { revalidate: REVALIDATE } });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}
