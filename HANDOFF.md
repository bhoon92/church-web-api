# 세션 핸드오프

> 최종 갱신: 2026-06-17
> 브랜치: `develop` (CI/CD 없이 develop 직접 커밋, 사용자가 수동 커밋)
> 다음 세션이 가장 먼저 읽어야 할 문서.

---

## 0. 현재 상태 한 줄

달력 이벤트 편집 + 조직도 게시판 스타일 + 갤러리 DnD + **Railway 배포 설정 완료(코드 측)**. **전부 커밋 완료, 워킹 트리 깨끗.**

> ✅ 미커밋 없음. 최신 커밋: `3ca17ce`. 진행 중 작업 없음.
> 🔴 **dev 서버 안 떠 있음**: 다음 세션은 **본인 터미널에서 `pnpm dev:api`/`pnpm dev:web` 한 번만** 띄울 것. [[feedback_devapi_background_restart]]
> 🚀 **배포 코드 준비 완료**: Railway 프로젝트 생성 + env 입력 + AWS S3 버킷 + Google OAuth redirect URI 추가만 남음(§3.3 수동 체크리스트).

---

## 1. 완료된 작업 (이번 세션)

### 1.17 Railway 배포 설정 (단일 서비스) ✅
- **아키텍처**: NestJS 1개 서비스가 API + 웹 정적 파일 모두 서빙. 같은 도메인 → CORS 불필요, 쿠키 그대로 동작.
- `apps/api/config/production.js` 신규: prod CORS(WEB_BASE_URL 기반)·쿠키(isSecure:true) 설정.
- `main.ts`: production에서 `app.setGlobalPrefix('api')` 적용 → `/api/*` 가 NestJS 라우트로 직접 도달. localdev는 Vite 프록시가 `/api` 제거하므로 조건부로만 적용.
- `app.module.ts`: `ServeStaticModule.forRoot({ rootPath: apps/web/dist, exclude: ['/api*'] })` — production 전용. SPA 폴백(React Router) 자동 처리.
- `app.controller.ts`: `GET /health` 엔드포인트 추가 (Railway 헬스체크 대상 `/api/health`).
- `scripts/generateEnv.ts`: `GOOGLE_REDIRECT_URI`, `WEB_BASE_URL`, `AWS_*` 3종 추가.
- `railway.toml` 신규: `buildCommand = "pnpm install --frozen-lockfile && pnpm build:web && pnpm build:api"`, `startCommand = "cd apps/api && node dist/src/main"` (CWD=apps/api 필수 — node-config 경로).
- `.envrc.sample` 전면 재작성: 로컬 변수 + prod 체크리스트(TZ·JWT·Postgres·Google·S3) 주석.
- `@nestjs/serve-static` 설치. `category-select.tsx` pre-existing tsc 오류(`onCreate` optional call) 빌드 시 발견 → `?.` 수정.
- ⚠️ feedPath는 이미 `/api/c/...` 하드코딩되어 있어 global prefix와 충돌 없음.

### 1.14 달력 이벤트 편집 모달 ✅
- `PATCH /calendar/events/:id` 엔드포인트 있었으나 프론트 미연결이었음.
- `api/calendar.ts`: `updateEvent(id, body)` 추가.
- `EventPill` 클릭: 삭제 confirm 직접 → `onEdit(event)` 호출로 변경 (hover opacity 피드백).
- `EventEditModal` 신규: 기존 데이터 pre-populated (제목·달력·종일·날짜·시간·장소·반복). 반복 일정이면 노란 경고 배너("저장 시 모든 반복 일정 수정"). 저장(PATCH) / 삭제(DELETE+confirm) / 취소.
- `['home','dashboard']` invalidate 포함.

### 1.15 조직도 게시판 스타일 + 역할 표시 ✅
- 카드 그리드 2열 → 단일 Card 안 아코디언 리스트로 교체.
- 접힌 행: 조직명 + "목장장 박병훈 · 팀장 김철수" 형식 (roleLabel 우선, 없으면 이름만).
- 펼친 행: 리더/구성원 섹션 분리, roleLabel → accent/neutral 배지로 강조.
- 여러 행 동시 펼치기 가능(행 자체 open state).

### 1.16 갤러리 드래그 앤 드롭 업로드 ✅
- `EventDetail` 사진 영역 drag-and-drop. 진입 시 파란 점선 + "여기에 놓으세요" 오버레이.
- 드롭 시 기존 `onFiles` 재사용 → presign→S3→confirm 순차 업로드.
- `relatedTarget` 기반 dragLeave로 자식 이동 시 깜빡임 없음. `canWrite` 없으면 무동작.

### 1.6 이번 세션 커밋
```
3ca17ce [FEAT] Railway 배포 설정 (단일 서비스, NestJS 정적 서빙)
0c96bae [DOCS] 핸드오프 갱신 (달력 편집·조직도·갤러리 DnD)
5a171d6 [FEAT] 갤러리 사진 드래그 앤 드롭 업로드
eb4025d [FEAT] 조직도 게시판 스타일 + 역할(roleLabel) 표시
2677b05 [FEAT] 달력 이벤트 편집 모달 (PATCH /calendar/events/:id 연결)
```

---

## 2. 진행 중인 작업

없음. 배포 코드 작업 완료(커밋). 남은 건 사용자 수동 작업(§3.3).

---

## 3. 남은 TODO

### 3.1 🚀 배포 수동 작업 체크리스트 (다음 우선순위)

Railway 코드는 준비됨. 아래 순서로 진행:

**1단계: AWS S3**
- [ ] S3 버킷 생성: `yakirim-photos`, 리전 `ap-northeast-2`, 퍼블릭 액세스 차단
- [ ] 버킷 CORS 설정 (AllowedOrigins: prod 도메인)
- [ ] IAM 사용자 `yakirim-s3` 생성, S3 권한 부여, 액세스 키 발급

**2단계: Google Cloud Console**
- [ ] Google Login OAuth 클라이언트 → 승인된 리다이렉션 URI 추가: `https://YOUR_DOMAIN/api/auth/google/callback`
- [ ] Google Calendar OAuth 클라이언트 → `https://YOUR_DOMAIN/api/google-calendar/callback` 추가

**3단계: Railway**
- [ ] railway.app → New Project → GitHub `yakirim` repo 선택
- [ ] Postgres 플러그인 추가 (Add Service → Database → PostgreSQL)
- [ ] Variables 탭에서 `.envrc.sample` 하단 체크리스트 참고해 모두 입력
  - `NODE_ENV=production`, `TZ=Asia/Seoul` (**필수 — 월집계 오늘일정 정확도**)
  - `PORT` (Railway 자동 주입, 별도 설정 불필요)
  - Postgres 내부 호스트 (Railway Postgres 서비스에서 복사)
  - JWT 두 개 (`openssl rand -base64 48` 별도 실행, 값 달라야 함)
  - Google, AWS, WEB_BASE_URL
- [ ] Deploy → 마이그레이션 자동 실행 (`migrationsRun: true`)
- [ ] `/api/health` 로 헬스체크 확인

### 3.2 기능 TODO (다음 세션 후보)
- **성도 추가 필드 편집 확장(선택)**: 이름·전화·재적상태 됨(§1.12). 생년월일·세례일·직업·주소 같은 패턴으로 가능 (백엔드 이미 전 필드 받음).
- **반복 일정 후속**: ①반복 종료일(UNTIL) ②per-occurrence 편집/삭제(EXDATE) ③달력 레이어 편집(`PATCH /calendar/calendars/:id` 미연결).
- **대시보드 실시간 갱신(선택)**: 헌금/거래/멤버 mutation에서 `['home','dashboard']` invalidate.
- **AllocationForm 예산 picker 연도 픽스** (이월): 폼이 `new Date().getFullYear()`로 조직 조회 → 과거 회계연도 예산 입력 시 올해 조직 뜸.
- **갤러리 행사 정보 수정** (`PATCH /events/:id` 미연결, 생성·삭제만).
- **회계연도 삭제 UI** (`DELETE /finance/fiscal-years/:id` 미연결, softDelete라 안전).

### 3.3 이전 세션에서 이월 (미터치)
- **Google Calendar push 라이브 검증**: 동의화면 calendar 스코프 + 테스트 사용자 등록.
- **refreshToken 암호화**: 현재 평문(DB 저장). production 전 필수.
- **⚠️ 서버 타임존**: Railway env `TZ=Asia/Seoul` 고정 필수 (월집계·오늘일정 UTC 9h 어긋남).
- FK `ON DELETE` 미결, super admin 분리, Postgres RLS, 자동 테스트.

### 3.4 다음 도메인 후보
1. 알림(앱내/SMS/카톡 채널 결정 필요).
2. 커스텀 역할(per-church) — 현재 고정 4역할.
3. 달력 양방향(개인 구글 일정 pull) — 현재 push만.

---

## 4. 중요한 결정사항과 이유

- **Railway 단일 서비스**: NestJS가 API(`/api/*`) + 정적(`/*`) 모두 처리. 별도 도메인 없으니 CORS 불필요, 쿠키도 그대로. 비용 최소.
- **global prefix `api`는 production 조건부**: localdev는 Vite 프록시가 `/api` 제거하므로 NestJS에 prefix 없어야 함. production에서만 `app.setGlobalPrefix('api')`.
- **`cd apps/api` 시작 필수**: `node-config`가 CWD 기준으로 `config/` 디렉터리 탐색. 레포 루트에서 시작하면 `config/` 못 찾음.
- **코드 스타일 = `.prettierrc`(semi:true)**: 단일 출처. [[feedback_code_style_prettier]]
- **날짜 = 로컬 기준(`lib/date.ts`)**: toISOString(UTC) 금지. [[feedback_local_date_no_utc]]
- **mutation은 onError 필수**: 조용한 실패(400/500 무반응) 방지.
- **미연결 백엔드 엔드포인트는 무감독 구현 보류** (§3.2): 추측 UI보다 문서화 후 설계 우선.

---

## 5. 다음 세션 컨텍스트

### 5.1 환경/상태
- **Postgres**: Homebrew `postgresql@14`, DB `yakirim`(`root`/`root1234`). **church id 1** = dev-login(`bhoon92@gmail.com`) 교회(owner). 성도 1명(박병훈, id 3).
- **마이그레이션 10개**: 전부 적용됨. `member_status` 테이블+교회별 시드, `member.status_id` NOT NULL.
- **포트**: API 기본 3030, 프론트 Vite 5173.

### 5.2 ⚠️ 중요 gotchas

- **Vite 프록시가 `/api`를 떼고 보냄**(`rewrite: /^\/api/ → ''`). **curl 테스트 시 `/api` 붙이면 404**. 예: `/finance/offerings`(로컬) vs `/api/finance/offerings`(프론트).
- **production에서는 반대**: global prefix `api` 적용 → NestJS 라우트가 `/api/...`로 노출됨.
- **dev-login**: `POST http://localhost:3030/auth/dev-login -d '{"email":"bhoon92@gmail.com"}'` → 쿠키 jar. localdev 전용.
- **`nest build`(build:api)가 `dev:api`(watch)를 죽인다**: 타입체크/마이그레이션 후 dev:api 재기동 필요.
- **🔴 dev:api 백그라운드 반복 기동 금지**: 누적 → "too many open files". `pkill -f "nest start"`로 부모까지. [[feedback_devapi_background_restart]]
- **`pnpm build:web`은 `tsc -b`(project references)로 빌드**: `npx tsc --noEmit`보다 엄격함. 빌드 전 반드시 `pnpm build:web` 로컬 검증.
- **lint-staged는 `*.ts`만**: `.tsx`는 안 잡음 → `cd apps/web && npx tsc --noEmit && npx eslint src` 수동.
- 마이그레이션: `direnv exec . pnpm migration:run` / `migration:generate <Name>` (build:api 먼저).

### 5.3 미커밋 파일
없음 (전부 커밋됨).

### 5.4 실행 명령
```sh
pnpm dev:api / pnpm dev:web
pnpm build:api && pnpm build:web   # 배포 전 전체 빌드 검증
direnv exec . pnpm migration:generate <Name>
direnv exec . pnpm migration:run
# API 검증 (로컬):
curl -s -c /tmp/cj.txt -X POST http://localhost:3030/auth/dev-login \
  -H 'Content-Type: application/json' -d '{"email":"bhoon92@gmail.com"}'
curl -s -b /tmp/cj.txt "http://localhost:3030/finance/offerings?date=2026-06-17"
# 프론트 빌드 검증:
cd apps/web && npx tsc --noEmit && npx eslint src
```

### 5.5 자동 메모리 (저장됨)
멀티테넌트 / user-centric / 실시간 finance / 모바일 정책 / entity 주석 한 줄 / DTO Request·Response 명명 / 약자·한글자 금지 / 배포=Railway Hobby / 코드 스타일=prettier(semi:true).

---

## 6. 이번 세션에서 배운 것

- **`pnpm build:web`(`tsc -b`)은 `npx tsc --noEmit`보다 엄격**: project references 빌드라 `tsconfig.app.json` 기준 적용. 후자에서 안 잡히던 `optional prop 직접 호출` 오류가 빌드 시 발견됨 → 배포 전 반드시 `pnpm build:web` 로컬 실행.
- **`node-config` CWD 의존**: Railway `startCommand`에서 `cd apps/api` 없으면 `config/` 못 찾아 앱이 시작 안 됨. 레포 루트에서 `node apps/api/dist/src/main`으로 실행하면 조용히 실패.
- **단일 서비스가 CORS 문제를 원천 차단**: web·api 분리 시 쿠키 도메인·CORS 헤더 설정이 복잡해짐. 같은 NestJS 프로세스에서 serve-static으로 웹 서빙하면 same-origin이라 전부 불필요.
- **`ServeStaticModule`의 `exclude: ['/api*']`**: API 라우트를 명시적으로 제외해야 `/api/finance/...` 요청이 컨트롤러로 가고 `index.html`로 폴백하지 않음.
- **iCal feedPath는 이미 `/api/` 포함**: `subscription.controller.ts`가 feedPath를 `/api/c/${token}.ics`로 하드코딩 → global prefix 추가해도 경로 불일치 없음. 단, 이후 prefix 변경 시 feedPath도 같이 바꿔야 함.
- **게시판(아코디언) UX = 클릭해서 펼치기**: 카드에 모두 노출하는 것보다 요약 행 → 클릭 → 펼침이 스캔 속도 빠름. 각 행이 own state를 가지면 상위 상태 불필요(단순).
- **드래그 앤 드롭 깜빡임은 `relatedTarget`으로 해결**: `dragLeave` 이벤트는 자식 요소로 이동할 때도 발화. `e.currentTarget.contains(e.relatedTarget as Node)`로 실제 영역 이탈 여부 판단 — counter 방식보다 코드 단순.

---

## 7. 누적 히스토리 (참고)

기반(멀티테넌트·OAuth·디자인) → 재적/소속/직분 → 심방 → 출석 → 재정(헌금·운영·예산·대시보드) → 영수증 PDF → Excel → 갤러리+S3 → 달력+iCal → RBAC/팀원 → 조직도+Google Calendar push → Google 로그인 검증 + 배포(Railway) 결정 → references CRUD + 드래그 정렬 + 연도별 편성 → 대시보드 실데이터 + 헌금/분류 수정·삭제 + UTC 날짜 픽스 + 달력 반복일정 + iCal 단축 + 성도 검색 + 재적상태 전환 + 소속 크래시 픽스 + access/refresh 토큰 분리 + 재적 모달 인라인 수정 + 설정 분산 → **(이번) 달력 이벤트 편집 모달 + 조직도 게시판 + 갤러리 DnD + Railway 배포 설정**.

planning.md = 살아있는 기획서. 도메인 모델/필드 상세는 planning.md + git log.
