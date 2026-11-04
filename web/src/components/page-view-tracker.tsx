"use client";
// 화면을 볼 때마다 API에 "이 화면을 봤어요"를 알려 관리 화면 방문 통계에 쌓습니다 (api/src/stats/stats.ts).
// 쿠키·로컬 저장 없이 주소와 들어온 곳만 보냅니다. 관리 화면은 세지 않고, 실패해도 화면에는 영향 없음.
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { API_URL } from "@/lib/api";

// 들어온 곳(검색엔진 등)은 처음 화면에만 의미가 있어요. 사이트 안에서 이동할 때는 보내지 않음
let firstView = true;

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const referrer = firstView ? document.referrer || undefined : undefined;
    firstView = false;
    fetch(`${API_URL}/stats/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer }),
      keepalive: true, // 화면을 바로 떠나도 보내지게
    }).catch(() => {});
  }, [pathname]);

  return null;
}
