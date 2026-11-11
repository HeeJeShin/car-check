// ─────────────────────────────────────────────────────────────
// 로그인 처리. 비밀번호는 다루지 않고, 구글이 "이 사람이 맞다"고 서명해 준 토큰(ID 토큰)만 믿습니다.
//   1) 화면의 구글 로그인 버튼 → 구글이 ID 토큰(JWT)을 줌
//   2) 화면이 그 토큰을 POST /auth/google로 보냄
//   3) 여기서 구글 공개키로 서명·발급자·대상(우리 Client ID)·만료를 검사
//   4) 이메일이 ADMIN_EMAILS·EDITOR_EMAILS에 있으면 그 역할을, 없으면 USER(일반 사용자)를 주고 우리 서비스용 토큰을 발급
//      일반 사용자는 회원가입(POST /auth/google/signup)을 해야 계정이 만들어지고, 그 전에는 로그인이 404입니다.
// USER는 내 차량(즐겨찾기)만 쓸 수 있습니다. 쓰기 API는 AuthGuard가 기본으로 ADMIN만 열어 두므로 관리 기능은 막혀 있습니다.
// ─────────────────────────────────────────────────────────────
import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTVerifyGetKey } from "jose";
import { randomBytes } from "node:crypto";
import type { Role } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type AuthUser = { id: number; email: string; name: string; picture: string | null; role: Role };

type Profile = { email: string; name: string; picture: string | null };

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const TOKEN_TTL = "12h";
const USER_TOKEN_TTL = "30d"; // 일반 사용자는 며칠 뒤 다시 와서 볼 수 있게. 권한이 내 차량뿐이라 관리자보다 길게 둡니다.

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly secret: Uint8Array;
  // 구글 공개키. 처음 쓸 때 받아 오고, 구글이 키를 바꾸면 자동으로 다시 받습니다.
  private googleKeys: JWTVerifyGetKey;

  constructor(private readonly prisma: PrismaService) {
    this.googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
    this.secret = new TextEncoder().encode(this.loadSecret());
  }

  /** 화면에 알려줄 설정: 구글 로그인 버튼에 쓸 Client ID */
  config() {
    return { googleClientId: process.env.GOOGLE_CLIENT_ID || null };
  }

  /** 로그인: 가입한 계정만. 관리자·에디터는 이메일 목록으로 정해지므로 가입 없이 들어옵니다. */
  async loginWithGoogle(credential: string) {
    return this.issue(await this.verifyGoogle(credential), false);
  }

  /** 회원가입: 개인정보 수집·이용 동의(컨트롤러에서 확인)를 받은 뒤 계정을 만듭니다. 이미 가입했으면 그대로 로그인됩니다. */
  async signupWithGoogle(credential: string) {
    return this.issue(await this.verifyGoogle(credential), true);
  }

  /** 구글 ID 토큰 검사 → 프로필 */
  private async verifyGoogle(credential: string): Promise<Profile> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new NotFoundException("지금은 구글 로그인을 쓸 수 없어요.");
    let payload;
    try {
      ({ payload } = await jwtVerify(credential, this.googleKeys, { issuer: GOOGLE_ISSUERS, audience: clientId }));
    } catch (err) {
      this.logger.warn(`구글 토큰 검증 실패: ${(err as Error).message}`);
      throw new UnauthorizedException("구글 로그인 정보를 확인하지 못했습니다. 다시 로그인해주세요.");
    }
    if (typeof payload.email !== "string" || payload.email_verified !== true) {
      throw new UnauthorizedException("이메일이 확인된 구글 계정만 로그인할 수 있습니다.");
    }
    return { email: payload.email, name: String(payload.name ?? payload.email), picture: typeof payload.picture === "string" ? payload.picture : null };
  }

  /** E2E 테스트 전용 로그인: 화면에는 없고, AUTH_DEV_LOGIN=true이고 운영 환경이 아닐 때만 동작합니다. */
  async loginForDev(email: string) {
    if (!devLoginEnabled()) throw new NotFoundException();
    return this.issue({ email, name: email.split("@")[0], picture: null }, true);
  }

  /** 요청의 Bearer 토큰 → 로그인한 사람. 토큰이 없거나 틀리면 null. */
  async verify(token: string): Promise<AuthUser | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret, { issuer: "car-check" });
      // 토큰을 발급한 뒤 역할이 바뀌었을 수 있어(.env 수정) DB의 현재 값을 씁니다.
      const user = await this.prisma.user.findUnique({ where: { id: Number(payload.sub) } });
      return user && { id: user.id, email: user.email, name: user.name, picture: user.picture, role: user.role };
    } catch {
      return null;
    }
  }

  /** 회원탈퇴(개인정보처리방침의 삭제 권리). 내 차량은 함께 지워집니다. 관리자·에디터 계정은 .env로 관리하므로 여기서 지우지 않습니다. */
  async deleteAccount(user: AuthUser) {
    if (user.role !== "USER") throw new ForbiddenException("관리자·에디터 계정은 여기서 탈퇴할 수 없어요.");
    // 예전에 에디터였던 계정은 심사 기록이 남아 있어 바로 지울 수 없습니다.
    if (await this.prisma.issueHistory.count({ where: { userId: user.id } })) {
      throw new ConflictException("심사 기록이 있는 계정은 이메일로 탈퇴를 요청해 주세요.");
    }
    await this.prisma.user.delete({ where: { id: user.id } });
  }

  private async issue({ email, name, picture }: Profile, signup: boolean) {
    const role = roleFor(email);
    if (role === "USER" && !signup && !(await this.prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } }))) {
      throw new NotFoundException("가입된 계정이 없어요.");
    }
    const agreedAt = signup ? new Date() : null;
    const user = await this.prisma.user.upsert({
      where: { email: email.toLowerCase() },
      create: { email: email.toLowerCase(), name, picture, role, agreedAt },
      update: { name, picture, role, lastLoginAt: new Date(), ...(agreedAt && { agreedAt }) },
    });
    const token = await new SignJWT({ role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(user.id))
      .setIssuer("car-check")
      .setIssuedAt()
      .setExpirationTime(user.role === "USER" ? USER_TOKEN_TTL : TOKEN_TTL)
      .sign(this.secret);
    return { token, user: { id: user.id, email: user.email, name: user.name, picture: user.picture, role: user.role } };
  }

  private loadSecret() {
    const secret = process.env.AUTH_JWT_SECRET;
    if (secret) return secret;
    if (process.env.NODE_ENV === "production") throw new Error("운영 환경에는 AUTH_JWT_SECRET이 필요합니다.");
    // 개발 중에는 비워도 되게: 서버를 켤 때마다 새로 만들므로, 서버를 다시 켜면 다시 로그인해야 합니다.
    this.logger.warn("AUTH_JWT_SECRET이 비어 있어 임시 비밀키를 씁니다. 서버를 다시 켜면 로그인이 풀립니다.");
    return randomBytes(32).toString("hex");
  }

  /** 테스트용: 구글 공개키 대신 테스트 키를 씁니다. */
  useGoogleKeysForTest(keys: JWTVerifyGetKey) {
    this.googleKeys = keys;
  }
}

/** .env의 이메일 목록으로 역할 결정. 둘 다에 있으면 ADMIN. 목록에 없으면 USER. */
export function roleFor(email: string): Role {
  const list = (name: string) => (process.env[name] ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const e = email.toLowerCase();
  if (list("ADMIN_EMAILS").includes(e)) return "ADMIN";
  if (list("EDITOR_EMAILS").includes(e)) return "EDITOR";
  return "USER";
}

export const devLoginEnabled = () => process.env.AUTH_DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";
