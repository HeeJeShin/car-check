import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from "class-validator";

export class PowertrainDto {
  @ApiProperty({ example: "1.7 디젤" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  engine: string;

  @ApiProperty({ enum: ["GASOLINE", "DIESEL", "LPG", "HYBRID", "EV"] })
  @IsIn(["GASOLINE", "DIESEL", "LPG", "HYBRID", "EV"])
  fuel: "GASOLINE" | "DIESEL" | "LPG" | "HYBRID" | "EV";

  @ApiProperty({ enum: ["AT", "DCT", "CVT", "MT", "REDUCER"] })
  @IsIn(["AT", "DCT", "CVT", "MT", "REDUCER"])
  transmission: "AT" | "DCT" | "CVT" | "MT" | "REDUCER";

  @ApiPropertyOptional({ example: "7단 DCT" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  gearbox?: string;

  @ApiPropertyOptional({ example: "2WD" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  drive?: string;
}

export class CreateCarModelDto {
  @ApiProperty({ example: "현대" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  maker: string;

  @ApiProperty({ example: "싼타페" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: "더 뉴 싼타페", description: "사람들이 부르는 세대 이름" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  displayName: string;

  @ApiProperty({ example: "TM", description: "세대 코드" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  generation: string;

  @ApiPropertyOptional({ example: "중형 SUV" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  segment?: string;

  @ApiProperty({ enum: ["SEDAN", "SUV", "LIGHT", "VAN"], description: "세단·SUV·경차·승합" })
  @IsIn(["SEDAN", "SUV", "LIGHT", "VAN"])
  bodyType: "SEDAN" | "SUV" | "LIGHT" | "VAN";

  @ApiProperty({ example: 2020 })
  @IsInt()
  @Min(1980)
  @Max(2100)
  yearFrom: number;

  @ApiPropertyOptional({ example: 2023, description: "비우면 현재 판매 중" })
  @IsOptional()
  @IsInt()
  @Min(1980)
  @Max(2100)
  yearTo?: number;

  @ApiPropertyOptional({ example: ["santafe", "더뉴싼타페"], description: "검색용 별칭" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  // 중첩 객체 검증: @ValidateNested + @Type이 있어야 배열 안 객체까지 DTO 규칙으로 검사합니다.
  @ApiPropertyOptional({ type: [PowertrainDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PowertrainDto)
  powertrains?: PowertrainDto[];
}
