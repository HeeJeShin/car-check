// ─────────────────────────────────────────────────────────────
// 로그인 처리. 비밀번호는 다루지 않고, 구글이 "이 사람이 맞다"고 서명해 준 토큰(ID 토큰)만 믿습니다.
//   1) 화면의 구글 로그인 버튼 → 구글이 ID 토큰(JWT)을 줌
//   2) 화면이 그 토큰을 POST /auth/google로 보냄
//   3) 여기서 구글 공개키로 서명·발급자·대상(우리 Client ID)·만료를 검사
//   4) 이메일이 ADMIN_EMAILS·EDITOR_EMAILS에 있으면 역할을 주고, 우리 서비스용 토큰(12시간)을 발급
// 목록에 없는 구글 계정은 로그인 자체를 거절합니다(누구나 가입하는 서비스가 아니라 관리자 전용이라서).
// ─────────────────────────────────────────────────────────────
import { ForbiddenException, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTVerifyGetKey } from "jose";
import { randomBytes } from "node:crypto";
import type { Role } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type AuthUser = { id: number; email: string; name: string; picture: string | null; role: Role };

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const TOKEN_TTL = "12h";

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

  /** 화면에 알려줄 설정: 구글 로그인 버튼에 쓸 Client ID, 개발용 로그인이 켜져 있는지 */
  config() {
    return { googleClientId: process.env.GOOGLE_CLIENT_ID || null, devLogin: devLoginEnabled() };
  }

  /** 구글 ID 토큰 → 우리 토큰 */
  async loginWithGoogle(credential: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new NotFoundException("구글 로그인이 설정되지 않았습니다. .env에 GOOGLE_CLIENT_ID를 넣으세요.");
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
    return this.issue(payload.email, String(payload.name ?? payload.email), typeof payload.picture === "string" ? payload.picture : null);
  }

  /** 개발용 로그인: 구글 설정 없이 이메일만으로. AUTH_DEV_LOGIN=true이고 운영 환경이 아닐 때만. */
  async loginForDev(email: string) {
    if (!devLoginEnabled()) throw new NotFoundException();
    return this.issue(email, email.split("@")[0], null);
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

  private async issue(email: string, name: string, picture: string | null) {
    const role = roleFor(email);
    if (!role) throw new ForbiddenException(`${email} 계정은 관리 권한이 없습니다. 관리자에게 등록을 요청하세요.`);
    const user = await this.prisma.user.upsert({
      where: { email: email.toLowerCase() },
      create: { email: email.toLowerCase(), name, picture, role },
      update: { name, picture, role, lastLoginAt: new Date() },
    });
    const token = await new SignJWT({ role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(user.id))
      .setIssuer("car-check")
      .setIssuedAt()
      .setExpirationTime(TOKEN_TTL)
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

/** .env의 이메일 목록으로 역할 결정. 둘 다에 있으면 ADMIN. 목록에 없으면 null(로그인 불가). */
export function roleFor(email: string): Role | null {
  const list = (name: string) => (process.env[name] ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const e = email.toLowerCase();
  if (list("ADMIN_EMAILS").includes(e)) return "ADMIN";
  if (list("EDITOR_EMAILS").includes(e)) return "EDITOR";
  return null;
}

export const devLoginEnabled = () => process.env.AUTH_DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";
