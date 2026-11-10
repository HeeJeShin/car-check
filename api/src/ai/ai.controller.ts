import { Body, Controller, Get, HttpCode, Ip, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/auth.guard";
import { AiService } from "./ai.service";
import { RecommendDto } from "./dto/ai.dto";

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
  @Post("recommend") // 한 문장 조건 → 등록된 차 중에서 차종·연식 추천
  @HttpCode(200)
  recommend(@Body() dto: RecommendDto, @Ip() ip: string) {
    return this.ai.recommend(dto, ip);
  }
}
