import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export const PARTS = ["엔진", "변속기", "전장", "하체", "차체", "기타"] as const;

export class CreateIssueDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  carModelId: number;

  @ApiPropertyOptional({ example: "1.7 디젤", description: "비우면 전 엔진 공통" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  engine?: string;

  @ApiProperty({ enum: PARTS })
  @IsIn(PARTS)
  part: string;

  @ApiProperty({ example: "7단 DCT 저속 변속 충격" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ description: "구매할 때 무엇을 어떻게 확인하는지" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  checkHow: string;

  @ApiPropertyOptional({ enum: ["LOW", "MEDIUM", "HIGH"] })
  @IsOptional()
  @IsIn(["LOW", "MEDIUM", "HIGH"])
  severity?: "LOW" | "MEDIUM" | "HIGH";

  @ApiPropertyOptional({ enum: ["DRAFT", "VERIFIED"] })
  @IsOptional()
  @IsIn(["DRAFT", "VERIFIED"])
  status?: "DRAFT" | "VERIFIED";

  @ApiPropertyOptional({ example: "https://..." })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

// PartialType: 모든 필드를 선택(optional)으로 바꾼 DTO. 수정(PATCH)은 바꿀 필드만 보내면 됩니다.
export class UpdateIssueDto extends PartialType(CreateIssueDto) {}
