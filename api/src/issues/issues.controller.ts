import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateIssueDto, UpdateIssueDto } from "./dto/create-issue.dto";
import { IssuesService } from "./issues.service";

// 관리용 API: 고질병 데이터를 직접 넣고, 고치고, 검증 처리합니다.
// 다음 단계: 로그인을 붙여 관리자만 쓰게 막기.
@ApiTags("issues")
@Controller("issues")
export class IssuesController {
  constructor(private readonly issues: IssuesService) {}

  @Post()
  create(@Body() dto: CreateIssueDto) {
    return this.issues.create(dto);
  }

  @Patch(":id") // 수정 + 검증 처리({ "status": "VERIFIED", "sourceUrl": "..." })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateIssueDto) {
    return this.issues.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.issues.remove(id);
  }
}
