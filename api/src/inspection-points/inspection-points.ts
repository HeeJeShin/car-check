// 본넷 점검 포인트 관리 API (빨간 동그라미 추가·삭제). 컨트롤러·서비스·DTO가 작아서 한 파일에 둡니다.
import { Body, Controller, Delete, HttpCode, Injectable, Module, NotFoundException, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { PrismaService } from "../prisma/prisma.service";

export class CreateInspectionPointDto {
  @ApiPropertyOptional({ example: 2, description: "비우면 모든 차 공통 포인트" })
  @IsOptional()
  @IsInt()
  carModelId?: number;

  @ApiProperty({ example: 10, description: "번호 순서" })
  @IsInt()
  @Min(0)
  order: number;

  @ApiProperty({ example: 42.9, description: "그림 가로 위치 (%)" })
  @IsNumber()
  @Min(0)
  @Max(100)
  x: number;

  @ApiProperty({ example: 38.5, description: "그림 세로 위치 (%)" })
  @IsNumber()
  @Min(0)
  @Max(100)
  y: number;

  @ApiProperty({ example: "엔진오일" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;

  @ApiProperty({ description: "보는 법" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  look: string;

  @ApiProperty({ description: "이러면 주의" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  bad: string;
}

@Injectable()
export class InspectionPointsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInspectionPointDto) {
    if (dto.carModelId !== undefined) {
      const car = await this.prisma.carModel.findUnique({ where: { id: dto.carModelId } });
      if (!car) throw new NotFoundException(`차종 ${dto.carModelId}번을 찾을 수 없습니다.`);
    }
    return this.prisma.inspectionPoint.create({ data: dto });
  }

  async remove(id: number) {
    const point = await this.prisma.inspectionPoint.findUnique({ where: { id } });
    if (!point) throw new NotFoundException(`점검 포인트 ${id}번을 찾을 수 없습니다.`);
    await this.prisma.inspectionPoint.delete({ where: { id } });
  }
}

@ApiTags("inspection-points")
@Controller("inspection-points")
export class InspectionPointsController {
  constructor(private readonly points: InspectionPointsService) {}

  @Post()
  create(@Body() dto: CreateInspectionPointDto) {
    return this.points.create(dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.points.remove(id);
  }
}

@Module({
  controllers: [InspectionPointsController],
  providers: [InspectionPointsService],
})
export class InspectionPointsModule {}
