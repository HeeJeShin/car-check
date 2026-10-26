import { Body, Controller, Get, Headers, HttpCode, Post, UnauthorizedException } from "@nestjs/common";
import { ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { Public } from "./auth.guard";
import { AuthService } from "./auth.service";

class GoogleLoginDto {
  @ApiProperty({ description: "구글 로그인 버튼이 준 ID 토큰(credential)" })
  @IsString()
  @IsNotEmpty()
  credential: string;
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

  @Get("config") // 화면이 구글 버튼·개발용 로그인을 보여줄지 정하는 데 씁니다.
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
  @Post("dev") // AUTH_DEV_LOGIN=true일 때만 (운영 환경에서는 항상 404)
  @HttpCode(200)
  dev(@Body() dto: DevLoginDto) {
    return this.auth.loginForDev(dto.email);
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
