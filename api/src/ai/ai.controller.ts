import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AiService } from "./ai.service";
import { GuideDto, RecommendDto } from "./dto/ai.dto";

@ApiTags("ai")
@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get("status") // 화면이 "AI 꺼짐/샘플/실제" 배지를 띄우는 데 씁니다.
  status() {
    return { mode: this.ai.mode() };
  }

  @Post("guide") // 아무것도 모를 때: 무엇부터 알아볼지
  @HttpCode(200)
  guide(@Body() dto: GuideDto) {
    return this.ai.guide(dto);
  }

  @Post("recommend") // 용도·예산별 차종 추천
  @HttpCode(200)
  recommend(@Body() dto: RecommendDto) {
    return this.ai.recommend(dto);
  }
}
