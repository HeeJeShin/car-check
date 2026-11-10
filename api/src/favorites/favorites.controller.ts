import { Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles } from "../auth/auth.guard";
import type { AuthUser } from "../auth/auth.service";
import { FavoritesService } from "./favorites.service";

// 로그인한 사람이면 누구나, 자기 목록만 다룹니다. 대상 사용자는 주소가 아니라 로그인 토큰에서 꺼냅니다.
@ApiTags("favorites")
@ApiBearerAuth()
@Roles("ADMIN", "EDITOR", "USER")
@Controller("favorites")
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.favorites.list(user.id);
  }

  @Put(":carModelId")
  @HttpCode(204)
  add(@CurrentUser() user: AuthUser, @Param("carModelId", ParseIntPipe) carModelId: number) {
    return this.favorites.add(user.id, carModelId);
  }

  @Delete(":carModelId")
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param("carModelId", ParseIntPipe) carModelId: number) {
    return this.favorites.remove(user.id, carModelId);
  }
}
