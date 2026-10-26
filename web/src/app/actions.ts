"use server";
// 관리 화면에서 데이터를 고친 뒤 부릅니다. 미리 만들어 둔 조회 화면(ISR)을 만료시켜 다음 방문 때 새 데이터로 다시 만들게 합니다.
// 데이터가 작아서 화면별로 고르지 않고 조회 화면 전부(이름표 "cars")를 만료시킵니다. (다시 만드는 비용은 첫 방문 1번뿐)
//
// updateTag: 이름표가 붙은 저장본을 즉시 만료시켜, 다음에 주소를 여는 사람은 새 데이터로 만든 화면을 받습니다.
// (화면 안에서 링크로 이동하는 경우는 첫 번째만 옛 화면일 수 있음 → lib/cached.ts 주석)
//
// 아무나 캐시를 지우지 못하게, 로그인 토큰이 진짜인지 API에 물어본 뒤에만 지웁니다.
import { updateTag } from "next/cache";
import { API_URL } from "@/lib/api";
import { CARS_TAG } from "@/lib/cached";

export async function refreshPublicPages(token: string | null) {
  if (!token) return;
  const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) return;
  updateTag(CARS_TAG);
}
