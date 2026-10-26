"use client";
// 맨 바깥 레이아웃까지 깨졌을 때의 마지막 화면. (보통 오류는 error.tsx가 받음)
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="ko">
      <body style={{ fontFamily: "sans-serif", padding: 24 }}>
        <h1>문제가 생겼어요</h1>
        <p>잠시 후 다시 시도해주세요.</p>
        <Link href="/">처음으로</Link>
      </body>
    </html>
  );
}
