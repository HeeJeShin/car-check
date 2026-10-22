import { Module } from "@nestjs/common";
import { AiModule } from "./ai/ai.module";
import { CarsModule } from "./cars/cars.module";
import { InspectionPointsModule } from "./inspection-points/inspection-points";
import { IssuesModule } from "./issues/issues.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule, CarsModule, IssuesModule, InspectionPointsModule, AiModule],
})
export class AppModule {}
