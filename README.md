# Car Check 🚗

차종과 연식을 넣으면 **중고차를 살 때 확인할 고질병과 체크 포인트**를 알려주는 서비스.

- **시작일**: 2026-10-10
- **구성**: `api/` NestJS + Prisma + PostgreSQL · `web/` Next.js + Tailwind (포트 3201)
- **AI**: Google Gemini (무료 등급). **AI 없이도 핵심 기능은 전부 동작합니다.**

## 역할 나누기: 데이터는 사람이, 안내는 AI가

| 기능 | 누가 | 이유 |
|---|---|---|
| 차종·연식별 고질병, 구매 시 확인법 | **DB (사람이 검증)** | 돈이 걸린 사실 정보라 AI의 그럴듯한 거짓말(환각)을 피해야 함 |
| 아무것도 모를 때 "무엇부터 알아볼지" | AI | 정답이 하나가 아닌 안내·설명 |
| 용도·예산별 차종 추천 | AI → DB 연결 | 추천 차종에 DB 고질병 링크를 붙여 줌 |

고질병 데이터는 `초안(DRAFT)`으로 들어가고, **검토 요청 → 관리자 승인(검증됨) 또는 반려**를 거칩니다. 승인은 출처 URL이 있어야만 됩니다(서버 규칙). 아래 "고질병 심사 흐름" 참고. 샘플 데이터(세대 이름·엔진·미션·고질병·점검 포인트)는 전부 Claude가 쓴 초안이라 **사실 확인이 필요합니다.**

## 실행

준비물: Node 22+, Docker Desktop. **패키지 매니저는 pnpm만 씁니다** (npm·yarn으로 설치하면 안내 메시지와 함께 멈춰요).

```bash
corepack enable           # 처음 한 번만. Node에 들어 있는 도구가 package.json에 적힌 pnpm 버전을 자동으로 받아요
pnpm install              # 저장소 맨 위 폴더에서. api·web을 한 번에 설치하고, .env가 없으면 .env.example을 복사해 둡니다
pnpm db:setup             # 처음 한 번: PostgreSQL 컨테이너(포트 5434) + 테이블 생성 + 샘플 데이터 (⚠️ 기존 데이터는 지워짐)
pnpm dev                  # API http://localhost:3200 (문서 /docs) + 화면 http://localhost:3201 동시 실행
```

- `corepack`이 없다고 나오면(Node 25 이상) `npm install -g pnpm` 으로 pnpm만 따로 설치하세요.
- 다음부터는 Docker Desktop을 켜고 `pnpm --dir api db:up` → `pnpm dev`만 하면 됩니다.
- 하나만 따로 띄우려면 `pnpm --dir api dev` / `pnpm --dir web dev`.

### IntelliJ에서 실행

1. 저장소 맨 위 폴더(`car-check`)를 열면 위쪽 실행 목록에 **전체 실행 (api + web)**, **api**, **web**, **DB 처음 준비 (데이터 초기화)** 가 나옵니다 (`.run/` 폴더).
2. Settings → Languages & Frameworks → Node.js에서 **Package manager가 pnpm**인지 확인하세요. (`package.json`의 `packageManager` 값을 보고 보통 자동으로 잡힙니다)
3. 터미널에서 `pnpm install`을 먼저 한 번 실행한 뒤 실행 버튼을 누르세요.

### AI 설정 (`api/.env`) — 셋 중 하나

| 하고 싶은 것 | 설정 | AI 가이드 화면 |
|---|---|---|
| **AI 없이 실행** (기본값) | `GEMINI_API_KEY=""`, `USE_MOCK_AI=false` | "AI 꺼짐" 안내. 차종 검색·고질병·데이터 관리는 정상 |
| 키 없이 AI 화면 흐름만 확인 | `USE_MOCK_AI=true` | 미리 준비된 샘플 답변 (비용·할당량 0) |
| 실제 Gemini 사용 | `GEMINI_API_KEY="발급받은 키"`, `USE_MOCK_AI=false` | 실제 답변 |

- 키 발급: [Google AI Studio](https://aistudio.google.com) (무료 등급은 하루·분당 요청 수 제한이 있음. 한도는 AI Studio에서 확인)
- 모델은 기본 `gemini-flash-latest`(최신 Flash). 바꾸려면 `GEMINI_MODEL`
- `.env`를 바꾸면 API 서버를 다시 시작하세요.
- **캐시·요청 제한** (실제 Gemini 모드에서만): 같은 질문(공백·대소문자 차이 무시)은 하루 동안 저장된 답을 재사용하고, 동시에 들어온 같은 질문도 Gemini는 한 번만 부릅니다. Gemini를 실제로 부르는 요청은 IP당 1분 5번·하루 30번, 서버 전체 1분 10번(`AI_GLOBAL_PER_MIN`)까지이고 넘으면 429와 "몇 초 뒤 다시" 안내를 줍니다. 둘 다 서버 메모리에 저장하므로 서버를 여러 대로 늘리면 Redis로 옮겨야 합니다.

## 관리 화면 로그인 (구글)

`/admin`과 쓰기 API(POST·PATCH·DELETE)는 로그인이 필요합니다. 조회(GET)와 AI 질문은 누구나 쓸 수 있어요.

| 역할 | 할 수 있는 것 | 정하는 곳 (`api/.env`) |
|---|---|---|
| ADMIN | 모든 수정 + "검증됨" 처리 + 삭제 + 차종 추가 | `ADMIN_EMAILS` |
| EDITOR | 고질병 초안·점검 포인트 작성, 초안 수정, 검토 요청. 승인·반려·검증 취소·삭제는 불가 | `EDITOR_EMAILS` |
| 그 외 구글 계정 | 로그인 거절 | |

- 쓰기 API는 **기본으로 ADMIN만** 열려 있고, 에디터도 되는 곳은 `@Roles("ADMIN", "EDITOR")`, 로그인 없이 되는 곳은 `@Public()`로 표시합니다(`api/src/auth/auth.guard.ts`). 새 API를 만들고 깜빡해도 열려 있지 않아요.
- 비밀번호는 다루지 않습니다. 구글이 서명한 ID 토큰을 API가 검증하고(서명·발급자·우리 Client ID·만료·이메일 확인), 우리 서비스용 토큰(12시간)을 발급합니다.

**구글 로그인 켜기** (한 번만)
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → 사용자 인증 정보 만들기 → **OAuth 클라이언트 ID** → 애플리케이션 유형 **웹 애플리케이션**
2. **승인된 JavaScript 원본**에 `http://localhost:3201` 추가 (배포하면 실제 화면 주소도)
3. 발급된 **클라이언트 ID**를 `api/.env`의 `GOOGLE_CLIENT_ID`에 넣고 API 다시 시작 (클라이언트 보안 비밀번호는 필요 없음)

구글 설정 전에도 `AUTH_DEV_LOGIN=true`면 관리 화면에서 **이메일만으로 로그인**할 수 있어요(개발·테스트용, 운영 환경에서는 항상 꺼짐). 이메일은 `ADMIN_EMAILS`·`EDITOR_EMAILS`에 있어야 합니다.

## 고질병 심사 흐름

```
초안 ──검토 요청──▶ 검토 중 ──승인(출처 필수, ADMIN)──▶ 검증됨
 ▲  ◀──요청 취소──     └──반려(사유 필수, ADMIN)──▶ 반려 ──다시 고치기──▶ 초안
 └────────────────── 검증 취소(사유 필수, ADMIN) ◀── 검증됨
```

- 허용되는 전이는 `api/src/issues/issue-workflow.ts`의 **표 하나**에만 있고, 표에 없는 전이(초안 → 검증됨 직행 등)는 서버가 거절합니다. 관리 화면 버튼도 이 표로 만들어 서버가 내려줍니다.
- 내용 수정은 초안·반려 상태에서만. 검토 중·검증된 정보는 초안으로 되돌린 뒤 고칩니다(심사 받은 내용이 몰래 바뀌지 않게).
- 반려된 정보는 사용자 화면에서 숨깁니다. 검토 중은 "참고"로 보여요.
- **변경 이력**(`IssueHistory`): 작성·수정·상태 전이마다 누가·언제·무엇을(수정한 칸의 전·후)·왜(사유)를 남깁니다. 변경과 이력은 **하나의 트랜잭션**으로 저장해서 이력 없는 변경이 생기지 않습니다.
- **동시성**: "지금 상태가 내가 본 상태일 때만 바꾸기"(조건부 업데이트)로, 두 관리자가 동시에 승인해도 한 명만 성공하고 나머지는 409("다른 사람이 먼저 바꿨어요")를 받습니다. 내용 수정도 마지막 수정 시각을 조건에 넣어 남의 수정을 덮어쓰지 않습니다.

## 화면 (기획 캔버스 그대로, 모바일 기준)

| 주소 | 내용 |
|---|---|
| `/` | 사이트 소개: 어려운 점 3가지 → 사용 방법 → 시작 버튼 |
| `/cars` | 차종 선택: 검색 + 제조사 탭(국산 각각, 수입 묶음) + 차 종류 필터(RV/SUV·세단·경차) → 차 이름 카드(이미지 없이 이름 + 차 종류) |
| `/generations/[maker]/[name]` | 세대·연식 선택: "올 뉴 투싼 (2015~2018)"처럼 고르기, 연식 입력으로 좁히기 |
| `/cars/[id]` | 고질병 리포트: 엔진·미션 요약 → 고질병(검증됨 먼저) → 매장 체크리스트(브라우저에 저장) → 공통 점검 |
| `/cars/[id]/inspect` | 매장 점검 가이드: 스펙별 주의점(DCT → 저속 꿀렁거림 등) → 본넷 그림 + 빨간 동그라미 → 시운전 순서 |
| `/guide` | AI: 무엇부터 알아볼지, 용도별 추천 (추천 차종 → 세대 선택으로 연결) |
| `/admin` | **구글 로그인 필요.** 차종·엔진 추가, 고질병 추가·검증·삭제, 이 차 본넷 점검 포인트 추가 |

**조회 화면은 ISR**(`/cars`, `/generations/…`, `/cars/[id]`, `/cars/[id]/inspect`): 서버가 API를 불러 화면을 만들어 저장해 두고, 다음 방문자부터는 저장된 화면을 그대로 줍니다(API 호출 없음). 1시간마다 뒤에서 새로 만들고, 관리 화면에서 데이터를 고치면 바로 지워져 다음 방문 때 반영됩니다(`web/src/app/actions.ts`). 체크리스트·필터처럼 움직이는 부분만 브라우저 컴포넌트(`web/src/components/`)입니다.
- `pnpm build` 때 `/cars`를 미리 만들기 때문에 **빌드할 때 API가 켜져 있어야 합니다.** 나머지 화면은 첫 방문 때 만들어요.
- `pnpm dev`(개발 모드)에서는 저장하지 않고 매번 새로 만듭니다. 캐시 동작은 `pnpm build && pnpm start`로 확인하세요.

## 데이터 구조 (`api/prisma/schema.prisma`)

| 테이블 | 내용 |
|---|---|
| `CarModel` | 세대 하나. `name`(투싼) + `displayName`(올 뉴 투싼) + 세대 코드 + 연식 구간 + 차급 + 차 종류(`bodyType`: 세단·SUV·경차·승합) |
| `Powertrain` | 세대별 엔진·미션 조합 (연료, 미션 종류 AT·DCT·CVT·MT). 미션·연료만 넣으면 주의점이 자동으로 붙음 (`api/src/cars/powertrain-tips.ts`) |
| `CarIssue` | 고질병. 초안(DRAFT) → 검토 중(IN_REVIEW) → 검증됨(VERIFIED, 출처 필수) / 반려(REJECTED) |
| `IssueHistory` | 고질병 변경 이력: 작성·수정(바뀐 칸 전·후)·상태 전이(사유), 한 사람(User) |
| `User` | 관리 화면에 로그인한 구글 계정 + 역할(ADMIN·EDITOR) |
| `InspectionPoint` | 본넷 그림 위 빨간 동그라미. `carModelId`가 없으면 모든 차 공통, 있으면 그 차만(점선). 위치는 그림 기준 % |

스키마를 고치면 `api` 폴더에서 `pnpm db:migrate` (마이그레이션 + Prisma Client 재생성)를 실행하세요.

차종 데이터는 `api/prisma/seed-data/`(제조사별 파일)에 있습니다. 파일에 차종을 추가한 뒤 `api` 폴더에서 **`pnpm db:add-missing`** 을 실행하면 DB에 없는 것만 추가합니다(기존 데이터 유지). `pnpm db:seed`는 전부 지우고 다시 넣습니다.

## API

| Method | Path | 설명 |
|---|---|---|
| GET | `/cars/models` | 차종 선택 화면용: 차 이름 단위 카드 |
| GET | `/cars/generations?maker=현대&name=투싼` | 한 차종의 세대들 |
| GET | `/cars/search?q=투싼&year=2015` | 이름·세대 이름·별칭 + 연식으로 찾기 |
| GET | `/cars/:id` | 리포트: 세대 + 엔진·미션 + 주의점 + 고질병 + 공통 점검 |
| GET | `/cars/:id/inspection` | 점검 가이드: 주의점 + 본넷 포인트 + 시운전 순서 |
| GET | `/cars` | 세대 전체 (관리용) |
| GET · POST | `/auth/config`, `/auth/google`, `/auth/dev`, `/auth/me` | 로그인 설정 · 구글 로그인 · 개발용 로그인 · 내 정보 |
| POST | `/cars` | 세대 + 엔진·미션 추가 🔒ADMIN |
| GET | `/issues?carModelId=2` | 관리 화면: 반려 포함 전부 + 이력 + 내가 누를 수 있는 심사 버튼 🔒ADMIN·EDITOR |
| POST · PATCH | `/issues`, `/issues/:id` | 고질병 추가(항상 초안)·내용 수정(초안·반려만) 🔒ADMIN·EDITOR |
| POST | `/issues/:id/transition` | 상태 전이 `{"to":"VERIFIED","sourceUrl":"..."}` / `{"to":"REJECTED","reason":"..."}` 🔒역할은 심사 흐름 표대로 |
| DELETE | `/issues/:id` | 삭제(이력도 같이 지워짐. 틀린 정보는 반려 권장) 🔒ADMIN |
| POST · DELETE | `/inspection-points`, `/inspection-points/:id` | 본넷 점검 포인트 추가 🔒ADMIN·EDITOR, 삭제 🔒ADMIN |

🔒 표시는 `Authorization: Bearer <로그인 토큰>`이 필요합니다. API 문서(`/docs`)의 Authorize 버튼에 토큰을 넣으면 바로 시험할 수 있어요.
| GET | `/ai/status` | AI 모드 (`gemini` / `mock` / `off`) |
| POST | `/ai/guide` · `/ai/recommend` | 무엇부터 알아볼지 · 용도별 추천 |

## 테스트
```bash
pnpm test
```

## 다음 단계 (아이디어)
- 고질병 데이터 채우기·검증하기 (인기 차종부터)
- 매물 정보(연식·주행거리·가격) 입력 → 상식 검사 ("연식 대비 주행거리가 너무 적음" 등)
