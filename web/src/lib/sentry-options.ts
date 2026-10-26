// 화면(브라우저·서버) 공통 Sentry 설정. NEXT_PUBLIC_SENTRY_DSN이 비어 있으면 아무것도 보내지 않습니다(로컬 기본값).
// DSN은 브라우저 코드에 들어가는 공개 값이라 NEXT_PUBLIC_으로 둡니다(비밀번호 아님).
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 성능 추적은 무료 할당량을 아끼려고 10%만
  // 개인정보·로그인 토큰이 섞이지 않게 헤더·본문·쿠키·사용자 정보는 보내지 않음
  dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [] },
};
