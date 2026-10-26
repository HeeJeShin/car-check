import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";
import { AiModule } from "./ai/ai.module";
import { AuthModule } from "./auth/auth.module";
import { CarsModule } from "./cars/cars.module";
import { HealthModule } from "./health";
import { InspectionPointsModule } from "./inspection-points/inspection-points";
import { IssuesModule } from "./issues/issues.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [SentryModule.forRoot(), PrismaModule, AuthModule, HealthModule, CarsModule, IssuesModule, InspectionPointsModule, AiModule],
  // 처리 못 한 에러(500대)를 Sentry로 보냄. 400대(HttpException)는 보내지 않음
  providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
