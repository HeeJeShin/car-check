"use server";
// 관리 화면에서 데이터를 고친 뒤 부릅니다. 미리 만들어 둔 조회 화면(ISR)을 지워 다음 방문 때 새 데이터로 다시 만들게 합니다.
// 데이터가 작아서 화면별로 고르지 않고 전부 지웁니다. (다시 만드는 비용은 첫 방문 1번뿐)
// 아무나 캐시를 지우지 못하게, 로그인 토큰이 진짜인지 API에 물어본 뒤에만 지웁니다.
import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";

export async function refreshPublicPages(token: string | null) {
  if (!token) return;
  const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) return;
  revalidatePath("/", "layout");
}
