import { Body, Controller, Delete, Get, Headers, HttpCode, Post, UnauthorizedException } from "@nestjs/common";
import { ApiProperty, ApiTags } from "@nestjs/swagger";
import { Equals, IsEmail, IsNotEmpty, IsString } from "class-validator";
import { CurrentUser, Public, Roles } from "./auth.guard";
import { type AuthUser, AuthService } from "./auth.service";

class GoogleLoginDto {
  @ApiProperty({ description: "구글 로그인 버튼이 준 ID 토큰(credential)" })
  @IsString()
  @IsNotEmpty()
  credential: string;
}

class GoogleSignupDto extends GoogleLoginDto {
  @ApiProperty({ description: "개인정보 수집·이용 동의 (필수)", example: true })
  @Equals(true, { message: "개인정보 수집·이용에 동의해야 가입할 수 있어요." })
  agreed: boolean;
}

class DevLoginDto {
  @ApiProperty({ example: "admin@example.com" })
  @IsEmail()
  email: string;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get("config") // 화면이 구글 버튼을 그리는 데 씁니다.
  config() {
    return this.auth.config();
  }

  @Public()
  @Post("google")
  @HttpCode(200)
  google(@Body() dto: GoogleLoginDto) {
    return this.auth.loginWithGoogle(dto.credential);
  }

  @Public()
  @Post("google/signup")
  @HttpCode(200)
  signup(@Body() dto: GoogleSignupDto) {
    return this.auth.signupWithGoogle(dto.credential);
  }

  @Public()
  @Post("dev") // E2E 테스트 전용. AUTH_DEV_LOGIN=true일 때만 (운영 환경에서는 항상 404)
  @HttpCode(200)
  dev(@Body() dto: DevLoginDto) {
    return this.auth.loginForDev(dto.email);
  }

  @Delete("me") // 회원탈퇴 (내 차량도 함께 삭제)
  @Roles("ADMIN", "EDITOR", "USER")
  @HttpCode(204)
  deleteMe(@CurrentUser() user: AuthUser) {
    return this.auth.deleteAccount(user);
  }

  // GET이라 Guard가 그냥 통과시키므로 여기서 직접 확인합니다.
  @Get("me")
  async me(@Headers("authorization") authorization?: string) {
    const token = authorization?.match(/^Bearer (.+)$/)?.[1];
    const user = token ? await this.auth.verify(token) : null;
    if (!user) throw new UnauthorizedException("로그인이 필요합니다.");
    return user;
  }
}
