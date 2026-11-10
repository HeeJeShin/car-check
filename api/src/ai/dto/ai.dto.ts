import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

// 입력 길이 제한 = 비용·할당량 제한. 긴 입력은 그대로 토큰이 됩니다.
export class RecommendDto {
  @ApiProperty({ example: "유지비가 적은 차 추천해 주세요" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  request: string;
}
