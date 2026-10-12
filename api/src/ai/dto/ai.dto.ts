import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

// 입력 길이 제한 = 비용·할당량 제한. 긴 입력은 그대로 토큰이 됩니다.
export class GuideDto {
  @ApiProperty({ example: "차를 하나도 모르는데 첫 중고차 사려면 뭐부터 알아봐야 해요?" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;
}

export class RecommendDto {
  @ApiProperty({ example: "출퇴근 + 주말 캠핑" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  purpose: string;

  @ApiProperty({ example: 1500, description: "예산(만원)" })
  @IsInt()
  @Min(100)
  @Max(20000)
  budgetManwon: number;

  @ApiPropertyOptional({ example: 4, description: "주로 타는 인원" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  passengers?: number;

  @ApiPropertyOptional({ example: "운전 초보, 주차가 쉬웠으면" })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
