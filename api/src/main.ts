// ─────────────────────────────────────────────────────────────
// 앱의 시작점. 모든 요청에 공통으로 적용할 설정을 여기서 합니다.
// ─────────────────────────────────────────────────────────────
import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 전역 ValidationPipe: body/query를 DTO 규칙으로 검사합니다. 이게 없으면 DTO 데코레이터는 장식일 뿐입니다.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // 화면(Next.js, 3201번 포트)에서 호출할 수 있게 CORS 허용.
  app.enableCors({ origin: ["http://localhost:3201"] });

  // API 문서 → http://localhost:3200/docs
  const config = new DocumentBuilder().setTitle("Car Check API").setDescription("중고차 고질병·구매 체크 API").build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3200);
}
bootstrap();
