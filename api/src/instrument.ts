// ─────────────────────────────────────────────────────────────
// Sentry(에러 수집) 시작. 다른 모든 코드보다 먼저 불려야 해서 main.ts의 첫 줄에서 import합니다.
// SENTRY_DSN이 비어 있으면 아무것도 보내지 않습니다(로컬 개발·테스트 기본값).
// 보내는 것: 서버가 처리하지 못한 에러(500대). 400대(입력 오류·권한 없음 등)는 정상 응답이라 보내지 않습니다.
// ─────────────────────────────────────────────────────────────
import "dotenv/config";
import * as Sentry from "@sentry/nestjs";

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
  // 성능 추적은 무료 할당량을 아끼려고 10%만
  tracesSampleRate: 0.1,
  // 개인정보·로그인 토큰이 섞이지 않게 요청 헤더·본문·쿠키·사용자 정보는 보내지 않음 (에러 위치·메시지·주소만)
  dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [] },
});
