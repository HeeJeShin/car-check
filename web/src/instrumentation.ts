// Next.js가 서버를 켤 때 한 번 부르는 파일. 서버에서 난 에러(화면 만들기 실패 등)를 Sentry로 보냅니다.
import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-options";

export function register() {
  Sentry.init(sentryOptions);
}

// 서버 컴포넌트·서버 액션·라우트에서 처리 못 한 에러
export const onRequestError = Sentry.captureRequestError;
