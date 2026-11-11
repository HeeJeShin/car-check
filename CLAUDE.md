# 중구 (car-check)

중고차 매장에서 차종·연식별 고질병과 점검 포인트를 휴대폰으로 바로 보는 서비스. 커뮤니티와 유튜브에 흩어진 차주 경험을 찾아다닐 시간이 없다는 문제에서 시작했습니다.

pnpm 워크스페이스: `api`(NestJS, Prisma, PostgreSQL), `web`(Next.js 16, Tailwind 4), `e2e`(Playwright). 자세한 설명은 `README.md`.

## 명령 (저장소 맨 위에서)

| 할 일 | 명령 |
|---|---|
| 개발 서버 (API 3200, 화면 3201) | `pnpm dev` |
| DB 켜기 (포트 5434) | `pnpm --dir api db:up` |
| 타입 검사 · 린트 · 단위 테스트 | `pnpm typecheck` · `pnpm lint` · `pnpm test` |
| E2E | `pnpm test:e2e` |
| 스키마 변경 반영 | `pnpm --dir api db:migrate` |

- E2E는 전용 DB `car_check_e2e`, 포트 3290·3291, 빌드 폴더 `web/.next-e2e`를 쓰고 매번 데이터를 새로 넣습니다. 개발 DB와 개발 서버에 영향이 없습니다.
- `pnpm db:setup`과 `db:seed`는 차종·고질병 데이터를 지웁니다. 요청 없이 개발 DB에 실행하지 않습니다.
- E2E 빌드 직후 `.next/dev/types`에서 나는 타입 오류는 개발 서버의 오래된 생성 파일 때문입니다. `src/` 오류만 봅니다.

## 제품 원칙

- 고질병은 정답이 아니라 **차주들의 경험 데이터**입니다. 정확·부정확으로 표현하지 않고 사용자 화면에는 '출처 있음'과 '참고'로 나눕니다. 코드의 상태값은 `VERIFIED` 그대로입니다.
- AI(Gemini)는 **차량 추천만** 합니다. 등록된 세대 안에서 고르고, 서버가 세대 번호와 판매 연식을 DB와 대조합니다(`api/src/ai/ai.service.ts`). 고질병을 AI가 단정하게 하지 않습니다.
- AI가 꺼져 있어도 AI 외 기능은 모두 동작해야 합니다.
- 시드 데이터는 사실 확인 전 초안입니다.

## 코드 규칙

- **권한:** 쓰기 API는 기본 ADMIN만 열립니다. 다른 역할은 `@Roles`, 로그인 없는 곳은 `@Public`으로 명시합니다(`api/src/auth/auth.guard.ts`). USER는 내 차량과 자기 계정만 다룹니다.
- **심사 흐름:** 상태 이동은 `api/src/issues/issue-workflow.ts`의 표에서만 정의합니다.
- **색상:** `web/src/app/globals.css`의 `@theme` 토큰(`bg-primary` 등)만 씁니다. 화면에 색상값을 직접 쓰지 않습니다. 본넷 그림과 방문 통계 그래프의 전용 색만 예외입니다.
- **버튼:** `components/button.tsx`의 `Button`, `LinkButton`을 씁니다. 스타일 문자열을 새로 만들지 않습니다.
- **화면 틀:** 헤더·푸터는 `app/layout.tsx`에서 한 번만 붙입니다. 모바일 안쪽 화면의 상단 줄은 `PageBar`, 가운데 카드 화면은 `PageCard`를 씁니다. PC에는 공통 헤더 아래에 다른 헤더 줄을 만들지 않고, 모든 화면을 흰 배경으로 씁니다.
- **개인정보:** 저장 항목이나 외부 서비스가 바뀌면 `web/src/app/privacy/page.tsx`도 함께 고칩니다.
- 설명 문구와 주석은 쉬운 한국어로 씁니다. 사용자에게 보이는 문구에 환경변수나 명령어 같은 개발자용 내용을 넣지 않습니다.

## 작업 흐름

- 기본 브랜치는 `master`입니다. 작업 브랜치 → PR → CI 통과 → rebase 병합 순서입니다.
- 커밋과 푸시, 배포는 요청받을 때만 합니다.
- `web/public/`은 코드에서 쓰지 않는 파일이라 커밋하지 않습니다.
- 배포: 화면은 Vercel, API는 Render(`master` CI 통과 후), DB는 Neon. 마이그레이션은 API가 켜질 때 자동 적용되므로 데이터를 지우지 않는 형태로 만듭니다.
- 포트폴리오(`~/IdeaProjects/resume/portfolio/app/projects/car-check`)의 수치는 사용자 확인 후에 바꿉니다.
