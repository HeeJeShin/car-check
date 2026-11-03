import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

// "틀린 내용 있어요"에서 고르는 체크박스. 화면(web/src/lib/api.ts)도 같은 키·문구를 씁니다.
export const REPORT_REASONS = {
  YEAR: "연식·세대가 달라요",
  ENGINE: "엔진·미션이 달라요",
  SYMPTOM: "증상 설명이 틀려요",
  CHECK: "확인 방법이 틀려요",
  SEVERITY: "심각도가 과장되거나 축소됐어요",
  FIXED: "이미 해결됐어요 (리콜·개선품)",
  OTHER: "기타",
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;
const REASON_KEYS = Object.keys(REPORT_REASONS) as ReportReason[];

export class CreateReportDto {
  @ApiProperty({ example: ["FIXED"], description: `무엇이 틀렸는지 (하나 이상): ${REASON_KEYS.join(", ")}` })
  @IsArray()
  @ArrayNotEmpty({ message: "무엇이 틀렸는지 하나 이상 골라주세요." })
  @ArrayMaxSize(REASON_KEYS.length)
  @IsIn(REASON_KEYS, { each: true })
  reasons: ReportReason[];

  @ApiPropertyOptional({ example: "2022년식부터 개선 피스톤이 들어가 오일 감소가 거의 없어요.", description: "'기타'를 고르면 필수" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({ example: "https://www.car.go.kr/" })
  @IsOptional()
  @IsUrl({}, { message: "근거 링크는 https://로 시작하는 주소로 넣어주세요." })
  @MaxLength(500)
  sourceUrl?: string;
}

export class AnswerReportDto {
  @ApiProperty({ example: "확인해 보니 맞는 지적이에요. 2022년식 내용을 고질병 설명에 반영했습니다." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  answer: string;
}
