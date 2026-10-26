import { ExecutionContext, ForbiddenException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { assertCanEdit } from "../issues/issues.service";
import type { PrismaService } from "../prisma/prisma.service";
import { AuthGuard, Public, Roles } from "./auth.guard";
import { AuthService, roleFor } from "./auth.service";

const CLIENT_ID = "test-client.apps.googleusercontent.com";

// DB 대신 메모리에 사용자를 저장하는 가짜 prisma
function fakePrisma() {
  const users = new Map<number, { id: number; email: string; name: string; picture: string | null; role: "ADMIN" | "EDITOR" }>();
  return {
    user: {
      upsert: vi.fn(async ({ where, create, update }) => {
        const found = [...users.values()].find((u) => u.email === where.email);
        const user = found ? { ...found, ...update } : { id: users.size + 1, ...create };
        users.set(user.id, user);
        return user;
      }),
      findUnique: vi.fn(async ({ where }) => users.get(where.id) ?? null),
    },
  } as unknown as PrismaService;
}

function setup(env: Record<string, string> = {}) {
  vi.stubEnv("AUTH_JWT_SECRET", "test-secret");
  vi.stubEnv("GOOGLE_CLIENT_ID", CLIENT_ID);
  vi.stubEnv("ADMIN_EMAILS", "boss@example.com");
  vi.stubEnv("EDITOR_EMAILS", "writer@example.com");
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return new AuthService(fakePrisma());
}
afterEach(() => vi.unstubAllEnvs());

// 구글 대신 테스트 키로 서명한 ID 토큰
let googleKey: CryptoKey;
let googleKeys: ReturnType<typeof createLocalJWKSet>;
beforeAll(async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  googleKey = privateKey;
  googleKeys = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), alg: "RS256" }] });
});
const googleToken = (claims: Record<string, unknown>, audience = CLIENT_ID) =>
  new SignJWT({ email_verified: true, name: "테스트", ...claims })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer("https://accounts.google.com")
    .setAudience(audience)
    .setExpirationTime("5m")
    .sign(googleKey);

describe("역할 결정 (.env 이메일 목록)", () => {
  it("ADMIN 목록 > EDITOR 목록 > 없음(null). 대소문자·공백 무시", () => {
    vi.stubEnv("ADMIN_EMAILS", " Boss@Example.com , other@x.com");
    vi.stubEnv("EDITOR_EMAILS", "writer@example.com,boss@example.com");
    expect(roleFor("boss@example.com")).toBe("ADMIN");
    expect(roleFor("WRITER@example.com")).toBe("EDITOR");
    expect(roleFor("stranger@example.com")).toBeNull();
  });
});

describe("구글 로그인", () => {
  it("구글이 서명한 토큰이면 우리 토큰을 발급하고, 그 토큰으로 사용자를 확인할 수 있다", async () => {
    const auth = setup();
    auth.useGoogleKeysForTest(googleKeys);
    const { token, user } = await auth.loginWithGoogle(await googleToken({ email: "boss@example.com" }));
    expect(user.role).toBe("ADMIN");
    expect((await auth.verify(token))?.email).toBe("boss@example.com");
  });

  it("다른 앱(Client ID)용 토큰, 이메일 미확인 계정, 목록에 없는 계정은 거절", async () => {
    const auth = setup();
    auth.useGoogleKeysForTest(googleKeys);
    await expect(auth.loginWithGoogle(await googleToken({ email: "boss@example.com" }, "other-app"))).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(auth.loginWithGoogle(await googleToken({ email: "boss@example.com", email_verified: false }))).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(auth.loginWithGoogle(await googleToken({ email: "stranger@example.com" }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("위조한 토큰(다른 키로 서명)은 거절", async () => {
    const auth = setup();
    auth.useGoogleKeysForTest(googleKeys);
    const { privateKey } = await generateKeyPair("RS256");
    const forged = await new SignJWT({ email: "boss@example.com", email_verified: true })
      .setProtectedHeader({ alg: "RS256" }).setIssuer("https://accounts.google.com").setAudience(CLIENT_ID).setExpirationTime("5m").sign(privateKey);
    await expect(auth.loginWithGoogle(forged)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("다른 비밀키로 만든 우리 토큰은 무효", async () => {
    const other = await setup({ AUTH_DEV_LOGIN: "true", AUTH_JWT_SECRET: "other" }).loginForDev("boss@example.com");
    expect(await setup().verify(other.token)).toBeNull();
  });
});

describe("개발용 로그인", () => {
  it("AUTH_DEV_LOGIN=true일 때만, 운영 환경에서는 켜도 404", async () => {
    await expect(setup().loginForDev("boss@example.com")).rejects.toBeInstanceOf(NotFoundException);
    expect((await setup({ AUTH_DEV_LOGIN: "true" }).loginForDev("boss@example.com")).user.role).toBe("ADMIN");
    await expect(setup({ AUTH_DEV_LOGIN: "true", NODE_ENV: "production" }).loginForDev("boss@example.com")).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe("AuthGuard: 쓰기 API는 기본으로 막고 필요한 곳만 연다", () => {
  class Handlers {
    adminOnly() {}
    editorToo() {}
    open() {}
  }
  // 테스트 파일에서는 데코레이터 문법 대신 직접 호출 (@Roles("ADMIN", "EDITOR"), @Public()과 같음)
  const decorate = (d: MethodDecorator, key: keyof Handlers) => d(Handlers.prototype, key, Object.getOwnPropertyDescriptor(Handlers.prototype, key)!);
  decorate(Roles("ADMIN", "EDITOR"), "editorToo");
  decorate(Public(), "open");
  async function call(handler: keyof Handlers, opts: { method?: string; as?: string } = {}) {
    const auth = setup({ AUTH_DEV_LOGIN: "true" });
    const token = opts.as ? (await auth.loginForDev(opts.as)).token : undefined;
    const req = { method: opts.method ?? "POST", headers: token ? { authorization: `Bearer ${token}` } : {} };
    const ctx = { getHandler: () => Handlers.prototype[handler], getClass: () => Handlers, switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
    return new AuthGuard(new Reflector(), auth).canActivate(ctx).then(() => "ok", (e) => e.constructor.name);
  }

  it("GET은 누구나", async () => expect(await call("adminOnly", { method: "GET" })).toBe("ok"));
  it("@Public 쓰기는 로그인 없이", async () => expect(await call("open")).toBe("ok"));
  it("표시 없는 쓰기는 로그인 없으면 401", async () => expect(await call("adminOnly")).toBe("UnauthorizedException"));
  it("표시 없는 쓰기는 ADMIN만, EDITOR는 403", async () => {
    expect(await call("adminOnly", { as: "boss@example.com" })).toBe("ok");
    expect(await call("adminOnly", { as: "writer@example.com" })).toBe("ForbiddenException");
  });
  it("@Roles(ADMIN, EDITOR)는 에디터도", async () => expect(await call("editorToo", { as: "writer@example.com" })).toBe("ok"));
});

describe("에디터 규칙 (고질병)", () => {
  const editor = { role: "EDITOR" as const };
  it("에디터는 초안 작성·수정 가능", () => {
    expect(() => assertCanEdit(editor, { nextStatus: "DRAFT" })).not.toThrow();
    expect(() => assertCanEdit(editor, { currentStatus: "DRAFT" })).not.toThrow();
  });
  it("에디터는 '검증됨' 처리도, 검증된 정보 수정도 못 함", () => {
    expect(() => assertCanEdit(editor, { nextStatus: "VERIFIED" })).toThrow(ForbiddenException);
    expect(() => assertCanEdit(editor, { currentStatus: "VERIFIED", nextStatus: "DRAFT" })).toThrow(ForbiddenException);
  });
  it("관리자는 모두 가능", () => expect(() => assertCanEdit({ role: "ADMIN" }, { currentStatus: "VERIFIED", nextStatus: "VERIFIED" })).not.toThrow());
});
