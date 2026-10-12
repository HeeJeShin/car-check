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

고질병 데이터는 `초안(DRAFT)`으로 들어가고, 출처를 확인하면 `검증됨(VERIFIED)`으로 바꿉니다. 검증됨은 출처 URL이 있어야만 저장됩니다(서버 규칙). 샘플 데이터는 전부 Claude가 쓴 초안이라 **사실 확인이 필요합니다.**

## 실행

준비물: Node 22+, pnpm, Docker Desktop

### 1. API (터미널 1)
```bash
cd api
pnpm install
cp .env.example .env      # 그대로 두면 AI 없이 실행됩니다
pnpm db:up                # PostgreSQL 컨테이너 (포트 5434)
pnpm db:migrate           # 테이블 생성
pnpm db:seed              # 샘플 차종 6개 + 고질병 초안 (기존 데이터는 지워짐)
pnpm start:dev            # http://localhost:3200 · API 문서 http://localhost:3200/docs
```

### 2. 화면 (터미널 2)
```bash
cd web
pnpm install
pnpm dev                  # http://localhost:3201
```

### AI 설정 (`api/.env`) — 셋 중 하나

| 하고 싶은 것 | 설정 | AI 가이드 화면 |
|---|---|---|
| **AI 없이 실행** (기본값) | `GEMINI_API_KEY=""`, `USE_MOCK_AI=false` | "AI 꺼짐" 안내. 차종 검색·고질병·데이터 관리는 정상 |
| 키 없이 AI 화면 흐름만 확인 | `USE_MOCK_AI=true` | 미리 준비된 샘플 답변 (비용·할당량 0) |
| 실제 Gemini 사용 | `GEMINI_API_KEY="발급받은 키"`, `USE_MOCK_AI=false` | 실제 답변 |

- 키 발급: [Google AI Studio](https://aistudio.google.com) (무료 등급은 하루·분당 요청 수 제한이 있음. 한도는 AI Studio에서 확인)
- 모델은 기본 `gemini-flash-latest`(최신 Flash). 바꾸려면 `GEMINI_MODEL`
- `.env`를 바꾸면 API 서버를 다시 시작하세요.

## 화면

| 주소 | 내용 |
|---|---|
| `/` | 차종 + 연식 검색. 같은 연식에 세대가 여러 개면(예: 2015 투싼 = LM, TL) 고르게 함 |
| `/cars/[id]` | 고질병 목록(검증됨 먼저, 심각한 것 먼저) + 살 때 확인할 것 + 공통 점검 |
| `/guide` | AI: 무엇부터 알아볼지, 용도별 추천 |
| `/admin` | 차종 추가, 고질병 추가·검증·삭제 |

## API

| Method | Path | 설명 |
|---|---|---|
| GET | `/cars` | 차종(세대) 전체 |
| GET | `/cars/search?q=투싼&year=2015` | 이름·별칭 + 연식으로 세대 찾기 |
| GET | `/cars/:id` | 차종 + 고질병 + 공통 점검 |
| POST | `/cars` | 차종 추가 |
| POST | `/issues` | 고질병 추가 |
| PATCH | `/issues/:id` | 수정 · 검증 처리 (`{"status":"VERIFIED","sourceUrl":"..."}`) |
| DELETE | `/issues/:id` | 삭제 |
| GET | `/ai/status` | AI 모드 (`gemini` / `mock` / `off`) |
| POST | `/ai/guide` | 무엇부터 알아볼지 |
| POST | `/ai/recommend` | 용도·예산별 추천 (구조화된 JSON 응답 + DB 차종 연결) |

## 테스트
```bash
cd api && pnpm test
```

## 다음 단계 (아이디어)
- 고질병 데이터 채우기·검증하기 (인기 차종부터)
- 관리 화면 로그인 (지금은 누구나 수정 가능)
- 매물 정보(연식·주행거리·가격) 입력 → 상식 검사 ("연식 대비 주행거리가 너무 적음" 등)
