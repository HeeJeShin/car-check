import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles } from "../auth/auth.guard";
import type { AuthUser } from "../auth/auth.service";
import { CreateIssueDto, TransitionDto, UpdateIssueDto } from "./dto/create-issue.dto";
import { IssuesService } from "./issues.service";

// 관리용 API: 고질병 작성·수정·심사. 전부 로그인 필요(auth.guard.ts).
//   목록·작성·수정·상태 전이: ADMIN, EDITOR (전이별 역할은 issue-workflow.ts의 표)
//   삭제: ADMIN만
@ApiTags("issues")
@ApiBearerAuth()
@Controller("issues")
export class IssuesController {
  constructor(private readonly issues: IssuesService) {}

  @Get() // 관리 화면: GET /issues?carModelId=2 → 반려 포함 전부 + 이력 + 누를 수 있는 버튼
  @Roles("ADMIN", "EDITOR")
  @ApiQuery({ name: "carModelId", example: 2 })
  list(@Query("carModelId") carModelId: string | undefined, @CurrentUser() user: AuthUser) {
    const id = Number(carModelId);
    if (!Number.isInteger(id)) throw new BadRequestException("carModelId가 필요합니다.");
    return this.issues.listForAdmin(id, user);
  }

  @Post() // 항상 초안(DRAFT)으로 저장
  @Roles("ADMIN", "EDITOR")
  create(@Body() dto: CreateIssueDto, @CurrentUser() user: AuthUser) {
    return this.issues.create(dto, user);
  }

  @Patch(":id") // 내용 수정. 초안·반려 상태에서만
  @Roles("ADMIN", "EDITOR")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateIssueDto, @CurrentUser() user: AuthUser) {
    return this.issues.update(id, dto, user);
  }

  @Post(":id/transition") // 상태 전이: { "to": "VERIFIED", "sourceUrl": "..." } / { "to": "REJECTED", "reason": "..." }
  @Roles("ADMIN", "EDITOR")
  @HttpCode(200)
  transition(@Param("id", ParseIntPipe) id: number, @Body() dto: TransitionDto, @CurrentUser() user: AuthUser) {
    return this.issues.transition(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.issues.remove(id);
  }
}
