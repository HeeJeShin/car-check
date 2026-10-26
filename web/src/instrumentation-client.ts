// 브라우저에서 화면이 뜰 때 한 번 실행. 브라우저에서 난 에러를 Sentry로 보냅니다.
import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-options";

Sentry.init(sentryOptions);

// 화면 이동 성능 추적용 (Sentry가 요구하는 이름)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
