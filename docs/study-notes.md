# 학습 노트: 중구로 새 스택 익히기

중구는 **새 스택을 직접 익히려고 시작한 학습 프로젝트**입니다.
실무에서는 4년 동안 프론트엔드(React·Next.js·TypeScript, JSP 레거시)를 했고, 백엔드와 인프라는 다른 팀이 맡았습니다.
그래서 이번에는 **API 서버, DB 설계, 인증, 테스트, 배포까지 혼자 끝까지** 만들어 보는 것이 목표입니다.

기능을 많이 만드는 것보다 **"왜 이렇게 나누는지" 이해하면서 만드는 것**을 우선했습니다.
코드 주석도 "무엇을 하는지"보다 "왜 이렇게 했는지"를 적는 쪽으로 썼습니다. (예: `api/src/prisma/prisma.service.ts`)

---

## 1. 무엇을 새로 익혔나

| 처음 다뤄본 것 | 이 프로젝트에서 어디에 | 내가 이해한 한 줄 |
|---|---|---|
| NestJS 모듈·컨트롤러·서비스 | `api/src/cars/`, `issues/`, `auth/`, `ai/` | 주소를 받는 곳(컨트롤러)과 실제 일을 하는 곳(서비스)을 나누고, 기능 단위로 모듈에 묶는다 |
| 의존성 주입(DI) | `api/src/prisma/prisma.service.ts` | 직접 `new` 하지 않고 Nest가 하나만 만들어 필요한 곳에 넣어준다. DB 연결을 서비스마다 만들면 커넥션이 고갈된다 |
| DTO + ValidationPipe | `api/src/*/dto/`, `api/src/main.ts` | 들어오는 값의 규칙을 클래스로 적고, 파이프가 실제로 검사한다. 파이프가 없으면 데코레이터는 장식일 뿐 |
| Guard (인증·권한) | `api/src/auth/auth.guard.ts` | 요청이 컨트롤러에 닿기 전의 문지기. 앱 전체에 걸고, 표시가 없는 쓰기 API는 기본으로 ADMIN만 |
| Prisma 스키마·마이그레이션 | `api/prisma/schema.prisma`, `migrations/` | 테이블을 코드로 정의하고, 바꿀 때마다 변경 기록이 폴더로 쌓인다 |
| 트랜잭션·조건부 업데이트 | `api/src/issues/issues.service.ts` | 상태 변경과 이력은 함께 저장되거나 함께 실패해야 한다. "내가 본 상태일 때만 바꾸기"로 동시 수정을 막는다 |
| 상태 기반 로직 | `api/src/issues/issue-workflow.ts` | 허용되는 상태 이동을 표 하나에 두고, 서버와 관리 화면이 같은 표를 본다 |
| Swagger | `api/src/main.ts` → `/docs` | DTO에 적은 설명이 API 문서가 된다 |
| Next.js ISR·Server Action | `web/src/app/cars/`, `web/src/app/actions.ts` | 조회 화면은 미리 만들어 저장해 두고, 관리 화면에서 고치면 그 저장본을 바로 지운다 |
| Playwright E2E | `e2e/tests/` | 사람이 브라우저로 눌러보던 확인을 자동으로 |
| GitHub Actions CI | `.github/workflows/ci.yml` | 코드를 올릴 때마다 빈 컴퓨터에서 DB를 띄우고 테스트를 돌린다 |
| 배포·에러 수집 | `render.yaml`, `web/vercel.json`, `api/src/instrument.ts` | 화면(Vercel)·API(Render)·DB(Neon)·에러(Sentry)를 각각 다른 곳에 맡기고 연결한다 |

### 회사 백엔드가 쓰던 Java Spring과 비교
NestJS의 개념은 Spring과 짝이 맞는 것이 많아, 나란히 놓고 정리했습니다.

| NestJS (중구) | Spring에서 비슷한 것 |
|---|---|
| `@Module` | `@Configuration` / 패키지 단위 구성 |
| `@Controller` + `@Get`·`@Post` | `@RestController` + `@GetMapping`·`@PostMapping` |
| `@Injectable` 서비스 + 생성자 주입 | `@Service` + 생성자 주입 |
| DTO + `class-validator` + ValidationPipe | DTO + `@Valid` (Bean Validation) |
| Guard | Spring Security 필터 / 인터셉터 |
| Prisma | JPA·MyBatis 같은 DB 접근 계층 |

---

## 2. 폴더 구조: 왜 이렇게 나눴나

```
car-check/
├── api/                          # 백엔드 (NestJS) ← 이번에 가장 많이 배운 부분
│   ├── prisma/
│   │   ├── schema.prisma         # 테이블 설계. 여기만 보면 데이터 구조가 보이게
│   │   ├── migrations/           # 스키마 변경 기록 6번: 처음 → 구조 → 차 종류 → 전기차 → 사용자 → 심사 흐름
│   │   ├── seed.ts               # 샘플 데이터 넣기 (전부 지우고 다시)
│   │   ├── add-missing.ts        # DB에 없는 차종만 추가 (기존 데이터 유지)
│   │   └── seed-data/            # 제조사별 차종 파일 (현대·기아·제네시스·수입)
│   └── src/
│       ├── main.ts               # 앱 시작: ValidationPipe, CORS, Swagger를 여기서 한 번에
│       ├── app.module.ts         # 기능 모듈들을 조립하는 곳
│       ├── instrument.ts         # Sentry. 다른 코드보다 먼저 불러야 해서 따로
│       ├── health.ts             # 배포 헬스체크 (/health)
│       ├── prisma/               # DB 연결을 Provider로 감싸 앱 전체에서 하나만 쓰게
│       ├── cars/                 # 차종 조회. controller(주소) → service(로직) → Prisma(DB)
│       │   ├── dto/              # 들어오는 값 규칙
│       │   └── powertrain-tips.ts   # "DCT → 저속 꿀렁거림"처럼 미션·연료로 붙는 주의점 (계산은 코드)
│       ├── issues/               # 고질병 + 심사 흐름
│       │   └── issue-workflow.ts # 허용되는 상태 이동 표 (규칙을 한 곳에)
│       ├── auth/                 # 구글 로그인 → 우리 토큰 발급 → Guard로 권한 확인
│       ├── ai/                   # Gemini 호출, 답변 캐시, 요청 제한, 키 없을 때 모의 답변
│       └── inspection-points/    # 본넷 점검 포인트. 작아서 controller·service·DTO를 한 파일에
├── web/                          # 화면 (Next.js) ← 실무에서 쓰던 스택
│   └── src/
│       ├── app/                  # 폴더 = 주소 (/cars, /cars/[id], /admin …)
│       │   └── actions.ts        # 관리 화면에서 고치면 조회 화면 저장본을 지우는 Server Action
│       ├── components/           # 체크리스트·필터처럼 브라우저에서 움직이는 부분만
│       └── lib/api.ts            # API 호출을 한곳에. 화면은 fetch 주소를 몰라도 되게
├── e2e/tests/                    # Playwright: 사용자 흐름, 관리자 심사 흐름
├── scripts/                      # pnpm만 쓰게 막기, .env 없으면 예시 복사
├── .github/workflows/ci.yml      # 타입 체크·린트·단위 테스트 → E2E
├── render.yaml                   # API 배포 설정 (Render)
└── docs/                         # 기획·회고·학습 노트
```

**나눌 때 기준으로 삼은 것**
- **기능별로 폴더를 나눈다** (`cars/`, `issues/`, `auth/`, `ai/`). 고질병을 고칠 때는 `issues/`만 열면 되게.
- **규칙은 한 곳에** 둔다. 심사 흐름은 `issue-workflow.ts`, 미션별 주의점은 `powertrain-tips.ts`, API 호출은 `lib/api.ts`.
- **작은 기능은 억지로 쪼개지 않는다.** `inspection-points`는 파일 하나로 충분해서 나누지 않았다.

---

## 3. 요청 하나가 지나가는 길

**사용자가 리포트를 열 때**
```
브라우저 → web/src/app/cars/[id]/page.tsx (저장해 둔 화면이 있으면 바로 응답, 1시간마다 새로 만듦)
        → API GET /cars/:id
        → CarsController → CarsService → PrismaService → PostgreSQL
```

**관리자가 고질병을 승인할 때**
```
관리 화면 → API POST /issues/:id/transition
        → AuthGuard (로그인했나? ADMIN인가?)
        → ValidationPipe (DTO 규칙에 맞나?)
        → IssuesController → IssuesService.transition()
            → issue-workflow.ts 표에 있는 이동인가? 출처 URL이 있나?
            → 트랜잭션: 상태 변경 + 이력 저장 (다른 사람이 먼저 바꿨으면 409)
        → web/src/app/actions.ts: 조회 화면 저장본 지우기 → 다음 방문자는 바로 "검증됨"
```

---

## 4. 어떻게 공부하고 있나
1. **기능 하나를 끝까지** 만든다. API → DB → 화면 → 테스트까지.
2. 막히거나 처음 보는 개념은 **"왜 필요한지"를 코드 주석이나 README에 내 말로** 적는다.
3. 회사에서 보던 것(Spring 백엔드, 인프라 팀이 맡던 배포)과 **나란히 놓고** 비교한다.
4. 끝나면 **회고**로 어려웠던 점을 남긴다 → [`retrospective.md`](./retrospective.md)

## 5. 다음에 공부할 것
- Redis·큐(BullMQ): AI로 고질병 후보를 모으는 배치 작업 (기획 3차)
- SSE: AI 답변을 생성되는 대로 보여주기
- 일반 사용자 인증과 커뮤니티 운영(신고·도배 방지) (기획 4차)
- 자세한 일정은 [`plan.md`](./plan.md)
