import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { CarsService } from "./cars.service";
import { CreateCarModelDto } from "./dto/create-car-model.dto";

// ⚠️ 라우트 순서 주의: "models", "generations", "search" 같은 고정 경로는 ":id"보다 위에 둬야
//    "search"가 id로 잡혀 ParseIntPipe 400 에러가 나지 않습니다.
@ApiTags("cars")
@Controller("cars")
export class CarsController {
  constructor(private readonly cars: CarsService) {}

  @Get() // 세대 전체 (관리 화면용)
  findAll() {
    return this.cars.findAll();
  }

  @Get("models") // 차종 선택 화면: 차 이름 단위 카드
  models() {
    return this.cars.models();
  }

  @Get("generations") // 세대·연식 선택 화면: GET /cars/generations?maker=현대&name=투싼
  @ApiQuery({ name: "maker", example: "현대" })
  @ApiQuery({ name: "name", example: "투싼" })
  generations(@Query("maker") maker?: string, @Query("name") name?: string) {
    if (!maker?.trim() || !name?.trim()) throw new BadRequestException("maker와 name이 필요합니다.");
    return this.cars.generations(maker.trim(), name.trim());
  }

  @Get("search") // GET /cars/search?q=투싼&year=2015
  @ApiQuery({ name: "q", example: "투싼" })
  @ApiQuery({ name: "year", required: false, example: 2015 })
  search(@Query("q") q?: string, @Query("year") year?: string) {
    if (!q?.trim()) throw new BadRequestException("q(차종 이름)가 필요합니다.");
    const y = year ? Number(year) : undefined;
    if (y !== undefined && !Number.isInteger(y)) throw new BadRequestException("year는 숫자여야 합니다.");
    return this.cars.search(q, y);
  }

  @Get(":id") // 고질병 리포트
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.cars.findOne(id);
  }

  @Get(":id/inspection") // 매장 점검 가이드 (본넷·시운전)
  inspection(@Param("id", ParseIntPipe) id: number) {
    return this.cars.inspection(id);
  }

  @Post() // 관리용: 차종(세대) + 엔진·미션 추가
  create(@Body() dto: CreateCarModelDto) {
    return this.cars.create(dto);
  }
}
