import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export const PARTS = ["엔진", "변속기", "전장", "하체", "차체", "기타"] as const;
const STATUSES = ["DRAFT", "IN_REVIEW", "VERIFIED", "REJECTED"] as const;

// 새 고질병은 항상 초안(DRAFT)으로 들어갑니다. 상태는 POST /issues/:id/transition으로만 바꿉니다.
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

  @ApiPropertyOptional({ example: "https://...", description: "찾아본 출처. 승인할 때 필요합니다." })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

// 수정(PATCH)은 바꿀 칸만 보냅니다. 어느 차종인지는 바꿀 수 없습니다.
export class UpdateIssueDto extends PartialType(OmitType(CreateIssueDto, ["carModelId"] as const)) {}

export class TransitionDto {
  @ApiProperty({ enum: STATUSES, example: "VERIFIED" })
  @IsIn(STATUSES)
  to: (typeof STATUSES)[number];

  @ApiPropertyOptional({ description: "반려·검증 취소 사유 (필수)", example: "출처가 개인 블로그 하나뿐이라 근거 부족" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: "승인할 때 출처. 비우면 이미 저장된 출처를 씁니다.", example: "https://www.car.go.kr/..." })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;
}
