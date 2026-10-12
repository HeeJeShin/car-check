import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { CarsService } from "./cars.service";
import { CreateCarModelDto } from "./dto/create-car-model.dto";

@ApiTags("cars")
@Controller("cars")
export class CarsController {
  constructor(private readonly cars: CarsService) {}

  @Get() // GET /cars → 등록된 차종(세대) 전체
  findAll() {
    return this.cars.findAll();
  }

  // GET /cars/search?q=투싼&year=2015
  // ⚠️ 라우트 순서 주의: ":id"보다 위에 있어야 "search"가 id로 잡히지 않습니다.
  @Get("search")
  @ApiQuery({ name: "q", example: "투싼" })
  @ApiQuery({ name: "year", required: false, example: 2015 })
  search(@Query("q") q?: string, @Query("year") year?: string) {
    if (!q?.trim()) throw new BadRequestException("q(차종 이름)가 필요합니다.");
    const y = year ? Number(year) : undefined;
    if (y !== undefined && !Number.isInteger(y)) throw new BadRequestException("year는 숫자여야 합니다.");
    return this.cars.search(q, y);
  }

  @Get(":id") // GET /cars/2 → 차종 + 고질병 + 공통 점검 항목
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.cars.findOne(id);
  }

  @Post() // 관리용: 차종(세대) 추가
  create(@Body() dto: CreateCarModelDto) {
    return this.cars.create(dto);
  }
}
