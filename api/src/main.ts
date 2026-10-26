// ─────────────────────────────────────────────────────────────
// 앱의 시작점. 모든 요청에 공통으로 적용할 설정을 여기서 합니다.
// ─────────────────────────────────────────────────────────────
// Sentry는 다른 모든 것보다 먼저 시작해야 에러를 놓치지 않습니다(.env도 여기서 읽음).
import "./instrument";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 배포 환경(Render 등)은 앞에 프록시가 있어 모든 요청이 프록시 IP로 보입니다.
  // TRUST_PROXY=1이면 X-Forwarded-For의 실제 사용자 IP를 써서, AI 요청 제한이 사람별로 제대로 걸립니다.
  if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));

  // 전역 ValidationPipe: body/query를 DTO 규칙으로 검사합니다. 이게 없으면 DTO 데코레이터는 장식일 뿐입니다.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // 화면(Next.js)에서 호출할 수 있게 CORS 허용. 배포하면 WEB_ORIGIN에 화면 주소를 넣으세요(쉼표로 여러 개).
  app.enableCors({ origin: (process.env.WEB_ORIGIN || "http://localhost:3201").split(",").map((o) => o.trim()) });

  // API 문서 → http://localhost:3200/docs
  // 자물쇠 버튼(Authorize)에 로그인 토큰을 넣으면 문서 화면에서 쓰기 API를 바로 시험할 수 있습니다.
  const config = new DocumentBuilder().setTitle("Car Check API").setDescription("중고차 고질병·구매 체크 API").addBearerAuth().build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3200);
}
bootstrap();
