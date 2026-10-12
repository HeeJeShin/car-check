import { Module } from "@nestjs/common";
import { AiModule } from "./ai/ai.module";
import { CarsModule } from "./cars/cars.module";
import { IssuesModule } from "./issues/issues.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule, CarsModule, IssuesModule, AiModule],
})
export class AppModule {}
