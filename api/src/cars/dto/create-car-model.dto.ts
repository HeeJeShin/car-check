import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

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

  @ApiProperty({ example: "TM", description: "세대 코드나 이름" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  generation: string;

  @ApiProperty({ example: 2018 })
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

  @ApiPropertyOptional({ example: ["santafe", "싼타페tm"], description: "검색용 별칭" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];
}
