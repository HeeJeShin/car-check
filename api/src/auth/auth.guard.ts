// ─────────────────────────────────────────────────────────────
// 모든 요청 앞에서 도는 문지기(전역 Guard).
//   - GET(조회)은 누구나. 단 @Roles가 붙은 GET(관리 화면용 목록 등)은 그 역할만
//   - 그 밖(POST·PATCH·DELETE)은 기본으로 ADMIN만. 에디터도 되는 곳은 @Roles("ADMIN", "EDITOR"),
//     로그인 없이 되는 곳(AI 질문, 로그인 자체)은 @Public()을 붙입니다.
// "기본은 막고 필요한 곳만 연다"라서, 새 쓰기 API를 만들고 깜빡해도 열려 있지 않습니다.
// ─────────────────────────────────────────────────────────────
import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException, createParamDecorator } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { Role } from "../generated/prisma/client";
import { type AuthUser, AuthService } from "./auth.service";

const PUBLIC = "auth:public";
const ROLES = "auth:roles";

/** 로그인 없이 쓸 수 있는 쓰기 API */
export const Public = () => SetMetadata(PUBLIC, true);
/** 이 역할만 쓸 수 있음 (쓰기 API 기본값은 ADMIN) */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);
/** 컨트롤러에서 로그인한 사람 꺼내기: create(@CurrentUser() user: AuthUser) */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>().user);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const targets = [ctx.getHandler(), ctx.getClass()];
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES, targets);
    const isRead = req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS";
    if (isRead && !roles) return true;
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC, targets)) return true;

    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const user = token ? await this.auth.verify(token) : null;
    if (!user) throw new UnauthorizedException("로그인이 필요합니다.");
    req.user = user;

    const allowed = roles ?? ["ADMIN"];
    if (!allowed.includes(user.role)) throw new ForbiddenException("이 작업은 관리자(ADMIN)만 할 수 있습니다.");
    return true;
  }
}
