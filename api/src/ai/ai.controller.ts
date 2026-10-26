import { Body, Controller, Get, HttpCode, Ip, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/auth.guard";
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

  // @Ip(): 요청 제한을 IP별로 세는 데 씁니다. 배포할 때 Nginx·로드밸런서 뒤에 두면 모든 요청이 그 장비 IP로 보이니,
  //        main.ts에서 app.set("trust proxy", 1)을 켜서 실제 사용자 IP(X-Forwarded-For)를 쓰게 하세요.
  @Public()
  @Post("guide") // 아무것도 모를 때: 무엇부터 알아볼지
  @HttpCode(200)
  guide(@Body() dto: GuideDto, @Ip() ip: string) {
    return this.ai.guide(dto, ip);
  }

  @Public()
  @Post("recommend") // 용도·예산별 차종 추천
  @HttpCode(200)
  recommend(@Body() dto: RecommendDto, @Ip() ip: string) {
    return this.ai.recommend(dto, ip);
  }
}
