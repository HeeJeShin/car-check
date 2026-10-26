// 배포 환경용 작은 API 두 개. 컨트롤러가 작아서 한 파일에 둡니다.
//   GET  /health              : 서버와 DB가 살아 있는지 (Render 헬스체크가 주기적으로 부름)
//   POST /health/sentry-test  : 일부러 500 에러를 내서 Sentry에 들어오는지 확인 (ADMIN만, auth.guard 기본값)
import { Controller, Get, HttpCode, Module, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "./prisma/prisma.service";

@ApiTags("health")
@Controller("health")
class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  }

  @Post("sentry-test")
  @ApiBearerAuth()
  @HttpCode(500)
  sentryTest() {
    throw new Error("Sentry 연결 확인용 에러입니다 (POST /health/sentry-test)");
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
