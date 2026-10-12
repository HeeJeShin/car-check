import { Module } from "@nestjs/common";
import { CarsController } from "./cars.controller";
import { CarsService } from "./cars.service";

@Module({
  controllers: [CarsController],
  providers: [CarsService],
  exports: [CarsService], // AI 추천에서 "DB에 있는 차종"을 찾을 때 씁니다.
})
export class CarsModule {}
