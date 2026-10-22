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

고질병 데이터는 `초안(DRAFT)`으로 들어가고, 출처를 확인하면 `검증됨(VERIFIED)`으로 바꿉니다. 검증됨은 출처 URL이 있어야만 저장됩니다(서버 규칙). 샘플 데이터(세대 이름·엔진·미션·고질병·점검 포인트)는 전부 Claude가 쓴 초안이라 **사실 확인이 필요합니다.**

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

## 화면 (기획 캔버스 그대로, 모바일 기준)

| 주소 | 내용 |
|---|---|
| `/` | 사이트 소개: 어려운 점 3가지 → 사용 방법 → 시작 버튼 |
| `/cars` | 차종 선택: 검색 + 제조사 탭(국산 각각, 수입 묶음) + 차 종류 필터(RV/SUV·세단·경차) → 차 이름 카드(이미지 없이 이름 + 차 종류) |
| `/generations?maker=&name=` | 세대·연식 선택: "올 뉴 투싼 (2015~2018)"처럼 고르기, 연식 입력으로 좁히기 |
| `/cars/[id]` | 고질병 리포트: 엔진·미션 요약 → 고질병(검증됨 먼저) → 매장 체크리스트(브라우저에 저장) → 공통 점검 |
| `/cars/[id]/inspect` | 매장 점검 가이드: 스펙별 주의점(DCT → 저속 꿀렁거림 등) → 본넷 그림 + 빨간 동그라미 → 시운전 순서 |
| `/guide` | AI: 무엇부터 알아볼지, 용도별 추천 (추천 차종 → 세대 선택으로 연결) |
| `/admin` | 차종·엔진 추가, 고질병 추가·검증·삭제, 이 차 본넷 점검 포인트 추가 |

## 데이터 구조 (`api/prisma/schema.prisma`)

| 테이블 | 내용 |
|---|---|
| `CarModel` | 세대 하나. `name`(투싼) + `displayName`(올 뉴 투싼) + 세대 코드 + 연식 구간 + 차급 + 차 종류(`bodyType`: 세단·SUV·경차·승합) |
| `Powertrain` | 세대별 엔진·미션 조합 (연료, 미션 종류 AT·DCT·CVT·MT). 미션·연료만 넣으면 주의점이 자동으로 붙음 (`api/src/cars/powertrain-tips.ts`) |
| `CarIssue` | 고질병. 초안(DRAFT) / 검증됨(VERIFIED, 출처 필수) |
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
| POST | `/cars` | 세대 + 엔진·미션 추가 |
| POST · PATCH · DELETE | `/issues`, `/issues/:id` | 고질병 추가·수정·검증(`{"status":"VERIFIED","sourceUrl":"..."}`)·삭제 |
| POST · DELETE | `/inspection-points`, `/inspection-points/:id` | 본넷 점검 포인트 추가·삭제 |
| GET | `/ai/status` | AI 모드 (`gemini` / `mock` / `off`) |
| POST | `/ai/guide` · `/ai/recommend` | 무엇부터 알아볼지 · 용도별 추천 |

## 테스트
```bash
pnpm test
```

## 다음 단계 (아이디어)
- 고질병 데이터 채우기·검증하기 (인기 차종부터)
- 관리 화면 로그인 (지금은 누구나 수정 가능)
- 매물 정보(연식·주행거리·가격) 입력 → 상식 검사 ("연식 대비 주행거리가 너무 적음" 등)
