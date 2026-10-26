import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles } from "../auth/auth.guard";
import type { AuthUser } from "../auth/auth.service";
import { CreateIssueDto, UpdateIssueDto } from "./dto/create-issue.dto";
import { IssuesService } from "./issues.service";

// 관리용 API: 고질병 데이터를 직접 넣고, 고치고, 검증 처리합니다. 로그인 필요(auth.guard.ts).
//   작성·수정: ADMIN, EDITOR (EDITOR는 "검증됨" 처리 불가 → issues.service.ts)
//   삭제: ADMIN만
@ApiTags("issues")
@ApiBearerAuth()
@Controller("issues")
export class IssuesController {
  constructor(private readonly issues: IssuesService) {}

  @Post()
  @Roles("ADMIN", "EDITOR")
  create(@Body() dto: CreateIssueDto, @CurrentUser() user: AuthUser) {
    return this.issues.create(dto, user);
  }

  @Patch(":id") // 수정 + 검증 처리({ "status": "VERIFIED", "sourceUrl": "..." })
  @Roles("ADMIN", "EDITOR")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateIssueDto, @CurrentUser() user: AuthUser) {
    return this.issues.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.issues.remove(id);
  }
}
