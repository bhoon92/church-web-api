# 세션 핸드오프

> 최종 갱신: 2026-06-16
> 브랜치: `develop` (CI/CD 없이 develop 직접 커밋, 사용자가 수동 커밋)
> 다음 세션이 가장 먼저 읽어야 할 문서.

---

## 0. 현재 상태 한 줄

달력 이벤트 편집 모달 + 조직도 게시판 스타일 + 갤러리 드래그 앤 드롭 추가. **전부 커밋 완료, 워킹 트리 깨끗.**

> ✅ 미커밋 없음. 최신 커밋: `git log --oneline` 확인. 진행 중 작업 없음.
> 🔴 **dev 서버 안 떠 있음**: 다음 세션은 **본인 터미널에서 `pnpm dev:api`/`pnpm dev:web` 한 번만** 띄울 것. [[feedback_devapi_background_restart]]
> ⚠️ §3.2에 **백엔드는 있으나 프론트 미연결인 엔드포인트 목록**(의도된 미래 기능).

---

## 1. 완료된 작업 (이번 세션)

### 1.14 달력 이벤트 편집 모달 ✅
- `PATCH /calendar/events/:id` 엔드포인트 있었으나 프론트 미연결이었음.
- `api/calendar.ts`: `updateEvent(id, body)` 추가.
- `EventPill` 클릭: 삭제 confirm 직접 → `onEdit(event)` 호출로 변경 (hover opacity 피드백 추가).
- `EventEditModal` 신규: 기존 데이터 pre-populated (제목·달력·종일·날짜·시간·장소·반복). 반복 일정이면 노란 경고 배너("저장 시 모든 반복 일정 수정"). 저장(PATCH) / 삭제(DELETE+confirm) / 취소.
- `['home','dashboard']` invalidate 포함(대시보드 오늘 일정 반영).

### 1.15 조직도 게시판 스타일 + 역할 표시 ✅
- 카드 그리드 2열 → 단일 Card 안 아코디언 리스트로 교체.
- 접힌 행: 조직명 + "목장장 박병훈 · 팀장 김철수" 형식 (roleLabel 있으면 역할명 우선, 없으면 이름만).
- 펼친 행: 리더/구성원 섹션 분리, roleLabel을 뮤트 텍스트 → accent/neutral 배지로 강조.
- 여러 행 동시 펼치기 가능(각 행 자체 open state).

### 1.16 갤러리 드래그 앤 드롭 업로드 ✅
- `EventDetail` 사진 영역에 drag-and-drop 추가.
- 파일 진입 시: 파란 점선 테두리 + 업로드 아이콘 + "여기에 놓으세요" 오버레이.
- 드롭 시 기존 `onFiles` 그대로 호출 → presign→S3→confirm 순차 업로드 (다중 파일).
- `relatedTarget` 기반 dragLeave 처리로 자식 요소 이동 시 깜빡임 없음.
- `canWrite` 없으면 드래그·드롭 모두 무동작.

### 1.1 대시보드 하드코딩 데모 데이터 제거 ✅
- `dashboard.tsx`가 전부 가짜 데이터(출석 248·헌금 12.4M·일정·최근활동·고정날짜)였음. 웹 실데이터 테스트 위해 정리.
- STATS 값 → `—` 플레이스홀더(라벨·아이콘 유지), UPCOMING/RECENT → 빈 배열 + 빈 상태 메시지, 고정 날짜 → 실제 오늘(`formatToday(new Date())`).
- 아직 API 미연동 화면 — 빈 껍데기로 렌더, 추후 연동 대상.

### 1.2 헌금 수정/삭제 기능 (백엔드 신규) ✅
- 헌금 컨트롤러엔 GET·POST·summary만 있었음 → **update/remove 신규**.
- `dto/update-offering.dto.ts` = `PartialType(CreateOfferingDto)`. `OfferingService.update`(member/category 변경분만 존재검증)/`remove`. 컨트롤러 `@Patch(':id')`·`@Delete(':id')`(`finance:write`, delete 204).
- curl 전구간 검증: POST 201 / PATCH 200 / DELETE 204.

### 1.3 헌금 내역 수정/삭제 + 분류 인라인 관리 UI ✅
- `finance.ts`: `patchJson` 헬퍼 + `updateOffering`/`deleteOffering`, 분류 `update`/`delete`(헌금·계정과목 양쪽).
- `offerings-view.tsx`: 헌금 행마다 **수정(연필)**·**삭제(휴지통)**. 수정은 금액·분류 인라인 편집 + 저장/취소. **모든 mutation에 onError 알림**.
- `category-select.tsx`: **편집 토글** → 분류 이름변경(인라인)·삭제(× + confirm). **blur=Enter 커밋**(포커스 빠지면 생성/이름변경 적용, Escape 취소). 이중 생성 방지 위해 Enter도 blur로 수렴. `onCreate/onUpdate/onDelete` 모두 optional → 폼에서만 관리 노출, 행 편집에선 선택만.
- **운영재정(operations-view)도 계정과목 관리 연결** — 동일 CategorySelect에 onUpdate/onDelete + `분류` 라벨. (계정과목 update/delete API는 있었으나 프론트 미연결이었음.)

### 1.4 UX 수정 (사용자 피드백) ✅
- **선택 분류 pill hover 흰색 반전** → 선택 상태는 `hover:opacity-90`(어두운 톤 유지), 미선택만 회색 hover.
- **헌금 폼 레이아웃 깨짐**(분류 많아지면 줄바꿈되며 성도검색·금액·추가 정렬 틀어짐) → **분류를 전체폭 별도 줄로 분리**. 위 줄 `[성도검색][금액][추가]`, 아래 줄 `분류 [pills…]`. 운영재정 폼도 `분류` 라벨로 통일.

### 1.5 UTC 날짜 버그 수정 (전역) ✅
- `new Date().toISOString().slice(0,10)`은 **UTC** → KST 저녁/밤엔 **어제 날짜**가 기본값(헌금 폼이 6/14인데 6/13으로 뜬 원인). attendance `shiftDate`도 로컬자정→UTC 변환이라 날짜 이동 오작동.
- **`lib/date.ts` 신규**(`toDateString`/`todayString`, 로컬 컴포넌트 기반). 헌금·운영재정·출석(shiftDate+today)·심방 **5곳 + 1함수** 전부 교체.

### 1.7 대시보드 실데이터 연동 (홈) ✅
- **`GET /dashboard` 신규**(`module/home`, HomeService/Controller/Module). 4역할 모두 read 권한이라 `JwtAuthGuard`만으로 접근.
  - stats: **이번 주 출석**(일~토 distinct 성도), **이번 달 헌금**(`OfferingService.sumBetween` 재사용), **이번 달 새가족**(`registeredAt` 이번 달), **예산 집행률**(`FiscalYearService.current`+`BudgetService.executionRate` 재사용, FY 없으면 null).
  - schedule: **오늘 시작 일정** + 달력 이름(layer)·색(color).
  - activity: **헌금·신규성도·운영거래** 최신 6건씩 조회 후 createdAt 시간순 병합 top 6. who/what/at(ISO) 서버 조립.
  - 재정만 FinanceModule 서비스 주입, 나머지는 `DataSources` 직접 조회로 모듈 결합 최소화.
- **프론트** `api/dashboard.ts` + `dashboard.tsx`: useQuery 연결. 일정 시각/종일 포맷, 최근활동 상대시간(`timeAgo`), kind별 색 점. **가짜 비교(delta) 제거**(비교 데이터 없음), 로딩 중 `—`. 헤더/섹션 액션을 실제 라우트(`/app/calendar`·`/app/finance`)로 연결(`Button asChild`+`Link`).
- curl 전구간 검증: 빈 상태 200 + 임시 이벤트로 schedule 렌더 경로까지 확인 후 정리.
- ⚠️ **타임존 주의**(§3.3): 주/월/오늘 범위 계산이 **서버 로컬타임** 기준. localdev(KST)는 정확하나 prod 서버가 UTC면 경계가 9h 어긋남. 기존 `finance/dashboard.service`도 동일 가정. 배포 시 서버 TZ=Asia/Seoul 고정 또는 tz-aware 처리 필요.

### 1.10 access/refresh 토큰 분리 (무상태 refresh) ✅
- 기존: access JWT 단일(2h) + 갱신 없음 → 2시간마다 강제 재로그인. config의 `jwt.refresh`(별도 secret, 30d)는 정의만 있고 미사용이었음.
- 로그인/교회선택 시 **access(2h)·refresh(30d) 둘 다 발급**, httpOnly 쿠키 2개(`yakirim_session` 2h, `yakirim_refresh` 30d).
- `POST /auth/refresh`(guard 없음): refresh 쿠키 검증(refresh secret) → access·refresh 재발급(회전). 실패 시 쿠키 정리 + 401. logout은 두 쿠키 모두 제거.
- 프론트 `lib/auth-refresh.ts`: **전역 fetch 인터셉터** — /api 401 시 /auth/refresh 후 원 요청 1회 재시도(single-flight, 재시도는 원 fetch라 무한루프 방지). `main.tsx`에서 `installAuthRefresh()`.
- 검증: 두 쿠키 발급/refresh 204/재발급 후 me 200/무쿠키 401/**access를 refresh로 위조 시 401**(secret 분리 확인).
- ⚠️ prod: `JWT_CMS_ACCESS/REFRESH_SECRET_KEY` 둘 다 prod 값 세팅 필수(이미 JWT 키 prod화 TODO에 포함). 무상태라 개별 세션 강제 폐기는 불가(필요 시 DB 저장 refresh로 확장).

### 1.13 설정 → 각 기능 페이지로 분산 (허들 낮추기) ✅
- 사용자 요청: 설정 한 곳에 모으지 말고 **쓰는 곳에서 바로 관리**(40-50대 사용성). 방식 = 각 페이지 "관리" 버튼 → 모달.
- **`components/reference-manager.tsx` 신규**: 기존 references 페이지의 CRUD(ReferenceTab+탭+연도+드래그정렬)를 `ReferenceManager({ kinds })` / `ReferenceManagerModal({ title, kinds, onClose })`로 추출.
- 배치: **조직도** '구성 관리'(부서·사역팀·목장) / **성도** '재적상태·직분' / **출석** '예배 관리' / **달력** 'Google 연동'(GoogleCalendarPanel 모달). 헌금분류·계정과목·회계연도는 이미 재정에 인라인.
- **`components/google-calendar-panel.tsx` 신규**: integrations 페이지의 GoogleCalendarCard 추출. OAuth 콜백 리다이렉트 `/app/settings/integrations` → **`/app/calendar?gcal=`** 로 변경(google-calendar.controller), 달력에서 `?gcal` 있으면 모달 자동 열림.
- **삭제**: `settings/references.tsx`·`settings/integrations.tsx` 페이지 + 라우트. 설정 페이지는 교회정보·팀원/권한만 + "나머지는 각 메뉴에서" 안내 카드. 죽은 카드(회계연도·카테고리) 제거. 잔존 링크 0 확인.
- 검증: web tsc·eslint 통과, API 빌드 통과. (단 라이브 검증은 dev:api FD 이슈로 못 함 — §5.2 gotcha.)

### 1.12 재적 상세 모달 인라인 수정 (이름·전화·재적상태) ✅
- 백엔드 `PATCH /members/:id`(UpdateMemberDto=전 필드 optional)는 있었고 프론트만 연결.
- `api/members.ts`: `updateMember(id, payload)` 신규. `UpdateMemberPayload.phone`은 비우기 위해 `string | null` 허용(null이면 클리어).
- `member-detail-modal.tsx` 헤더:
  - **EditableName**: 이름 클릭/연필 → input, Enter·blur 저장, Escape 취소(+`stopPropagation`으로 모달 닫힘 방지).
  - **EditablePhone**: 동일 패턴. 전화 없으면 "전화번호 추가" 버튼, 비우면 null 클리어.
  - **EditableStatus**: 배지 클릭 → 재적상태 활성목록 드롭다운 선택 → PATCH. 바깥클릭 닫힘.
  - 셋 다 `member:write` 권한만 편집, onError 알림 + `['member']`·`['members']` invalidate.
- 검증: 이름·전화 설정/null클리어·statusId 변경 전부 200.

### 1.11 성도 검색 개선 + iCal URL 단축 + 소속 크래시 픽스 ✅
- **성도 검색**: 이름·전화 검색에서 **이전교회 매칭 제거**(placeholder도). **소속(부서/사역팀/목장) 필터** 드롭다운 추가 — `?affiliationKind=&affiliationId=` → 해당 활성 소속 성도만(`AffiliationService.memberIdsFor` 역방향 조회). 검색 입력 **300ms 디바운스**(키 입력마다 쿼리 방지). 성능: 한 교회 규모(수백~수천)면 ILIKE 순차스캔도 충분, 필요 시 pg_trgm GIN.
- **모달 Esc 닫기**: 달력·성도 상세 모달 모두 Escape로 닫힘(ModalShell/useEffect keydown).
- **iCal 구독 URL 단축**: 토큰 UUID(36자)→base62 14자(~83비트), 경로 `/calendar/feed/`→`/c/`. feedPath는 백엔드가 내려줌. 기존 토큰도 새 경로 동작, 재발급 시 짧은 토큰.
- **⭐ 소속 다중배정 크래시 픽스(`01bbdbe`)**: `AffiliationService.currentJoins`가 reference id 배열을 `where:{id:배열}`로 넣어 `id=$1`에 배열 바인딩 → `invalid input syntax for integer`(500). **같은 종류 소속 2개 이상이면 성도 상세 조회가 깨졌음**(사용자 "A설정 후 B설정 시 에러"의 실제 원인). `In(referenceIds)`로 수정. dept/ministry/smallGroup 전부 영향받았음.

### 1.9 성도 '단계'(enum) → '재적상태'(교회별 편집 reference) 전환 ✅
- 사용자 요청: 단계 값(정식/이명/별세)을 교회가 직접 추가/편집, "단계" 명칭 변경(→**재적상태**, 별세·이명이 자연스러워짐).
- **enum `lifecycleStage` → `member_status` 참조테이블**(교회별). 컬럼: name·sortOrder·isActive + `systemKey`('anonymous'|'new')·`countsInRoster`.
  - 마이그레이션 `AddMemberStatus`(적용됨, id 10): 테이블+교회별 기본값 시드(방문/새가족/정식/이명/별세/장기결석/익명) + `member.status_id` 백필. **기존 `lifecycle_stage` enum 컬럼은 롤백 안전 위해 보존(미사용)**.
  - `MemberStatusService/Controller`(member 모듈): CRUD + **가드**(systemKey 상태·사용중 상태 삭제 409, 익명은 목록 제외).
  - 소비처 재배선: 출석 제외=`countsInRoster=false`(별세/이명/익명), 영수증 익명=`systemKey='anonymous'`, 대시보드 새가족 라벨=`systemKey='new'`, 성도 카운트=상태별 동적(`{all, byStatus:[{id,name,count}]}`), export 라벨=상태명. DTO `lifecycleStage/stage`→`statusId`.
  - 프론트: `references.ts`에 **'memberStatus' kind 추가** → 설정>참조에 "재적상태" 탭 그대로 재사용. 성도 필터칩·생성폼 picker 동적화, 배지=statusName.
- curl 검증: 목록(익명 제외)·커스텀 추가·시스템삭제 409·사용중삭제 409·미사용삭제 204·statusId 생성 ✅.
- ⚠️ v1: 익명은 내부용(무명헌금)이라 UI 비노출. 신규 성도 미지정 시 sortOrder 최소 활성상태(방문) 기본. `lifecycle_stage` enum 컬럼은 다음 정리 때 drop 가능.

### 1.8 달력 반복 일정 (애플 캘린더식) ✅
- **5종**: 매일/매주/2주마다/매월/매년. 일정 추가 모달에 반복 선택 pill.
- **아키텍처**: 한 행에 `recurrence` 토큰만 저장 → **조회 시 occurrence 펼침**(materialize 안 함). 행 폭증·Google 과다호출 회피, iCal/Google은 RRULE 네이티브 활용.
  - `calendar_event.recurrence` varchar nullable + 마이그레이션 `AddCalendarEventRecurrence`(적용됨, id 9).
  - `module/calendar/recurrence.ts`: 토큰↔RRULE↔ical repeating 매핑 + `nextOccurrence`.
  - `CalendarEventService.list`: 반복 일정을 `[from,to]` occurrence 로 펼침(과거 시작분 포함, `MAX_OCCURRENCES=750` 가드). 반환 타입 `CalendarEventView`(ISO 문자열).
  - iCal 피드: `repeating`(RRULE) 한 줄. Google 동기화: `recurrence:['RRULE:...']`.
  - 홈 대시보드 오늘 일정도 `CalendarEventService.list` 재사용 → 달력과 일관(반복 occurrence 표시).
- 프론트: 반복 pill 선택, 반복 일정에 `Repeat` 아이콘, 삭제 시 "전체 반복 삭제" 경고.
- curl 검증: 매주(6월 4건)·격주(2건)·매월(6~9월 4건)·시리즈 삭제(204) ✅.
- ⚠️ **v1 한계**(§3.1): per-occurrence 예외/편집 없음(삭제=시리즈 전체). 반복 종료일(UNTIL) 없음(무한, 조회 범위로 bound). 매월 31일 등은 JS `setMonth` 오버플로 동작(다음달로 밀림). 일정 **편집 UI 자체가 아직 없음**(PATCH 엔드포인트만 존재).

### 1.6 이번 세션 커밋 (오래된→최신)
```
53608b2 [FIX] reference partial PATCH 허용 (UpdateReferenceDto)   # 직전 세션 작업 커밋
8e8e2a9 [FEAT] 연도별 편성 (부서·사역팀·목장) + 다운스트림 연도 인지화  # 직전 세션 작업 커밋
e7ac3ae [STYLE] church-branding prettier 포맷 (semi:true)         # 직전 세션 작업 커밋
68d92a9 [DOCS] 세션 핸드오프 + 기획서 갱신
69f42f8 [CHORE] 대시보드 하드코딩 예시 데이터 제거
ba650fb [FEAT] 헌금 수정/삭제 API
c9b1e96 [FEAT] 헌금 내역 수정/삭제 + 분류 인라인 관리 UI
285841d [FIX] 날짜 기본값 UTC→로컬 (한국 밤 시간 하루 밀림)
2c42bc5 [FEAT] 운영재정 계정과목 수정/삭제 UI 연결
98ae12d [FIX] 예산 화면 mutation onError 알림 추가
9e5617d [DOCS] 핸드오프 갱신 (중간)
d1e1b7e [FEAT] 홈 대시보드 집계 API (GET /dashboard)
2e19a5e [FEAT] 대시보드 실데이터 연동
935228f [DOCS] 핸드오프 (중간)
a6ae1ac [FEAT] 달력 반복 일정 (매일/매주/2주마다/매월/매년)
8533410 [FEAT] 달력 반복 일정 추가 UI
```
> 앞 3개(53608b2~e7ac3ae)와 8e8e2a9는 **직전 세션의 연도별 편성 작업을 이번 세션 초반에 커밋**한 것. 나머지가 이번 세션 신규 작업.

---

## 2. 진행 중인 작업

없음. 직전 작업(재적 모달 이름·전화·재적상태 인라인 수정, §1.12) 완료 + 커밋.
- 참고: 모달엔 생년월일·세례일·직업·주소 등 다른 필드도 있는데 아직 편집 미연결. 필요하면 같은 `updateMember` + 인라인 패턴으로 확장 가능(백엔드는 이미 전 필드 받음).

---

## 3. 남은 TODO

### 3.1 다음에 바로 할 만한 것
- **성도 추가 필드 편집 확장(선택)**: 모달에서 이름·전화·재적상태는 인라인 수정됨(§1.12). 생년월일·세례일·직업·주소 등도 원하면 같은 패턴으로.
- **반복 일정 후속**(v1 한계, §1.8): ①반복 종료일(UNTIL) 옵션 ②per-occurrence 편집/삭제(EXDATE + 이 일정만/이후 모두) ③일정 **편집 모달**(현재 생성·삭제만, PATCH 엔드포인트는 있음). 편집 모달 만들 때 반복 변경 UX 함께 설계.
- **대시보드 실시간 갱신(선택)**: 현재 `['home','dashboard']`는 페이지 mount 시 refetch라 홈 재진입 시 최신. 헌금/거래/멤버 추가 mutation에서 `['home','dashboard']`까지 invalidate하면 더 즉각적. (project_real_time_dashboard 가치)
- **새가족 정의 확인**: 대시보드 "이번 달 새가족"은 `registeredAt`이 이번 달인 멤버 수. registeredAt이 null인 멤버(방문/미등록)는 제외. 의도와 다르면 lifecycleStage=NEW 기준 등으로 조정.
- **AllocationForm 예산 picker = 현재 달력연도 단순화**(직전 세션 이월): 예산은 `fiscalYearId`에 묶이는데 폼이 `new Date().getFullYear()`로 조직을 조회 → 과거 회계연도 예산 입력 시 올해 조직이 뜸. 정확히 묶으려면 FiscalYear의 연도를 폼까지 내려야 함.
- **드래그앤드롭 터치 미지원**(이월): references 정렬이 네이티브 DnD라 마우스 전용. 태블릿 필요 시 dnd-kit.

### 3.2 ⭐ API↔프론트 커버리지 점검 결과 (이번 세션 전수 조사)
백엔드 라우트 112개 vs 프론트 호출 전수 대조. **대부분 연결됨.** 백엔드에 있으나 **프론트 미연결**(=미완 기능 또는 미래용)인 것들 — 무감독 구현은 보류, 다음 세션에서 UX 설계 후 붙일 후보:
- **`PATCH /calendar/calendars/:id`, `PATCH /calendar/events/:id`** — 달력 레이어/일정 **수정** 미구현(현재 생성·삭제만). 일정 오타 수정 수요 있음. 편집 모달 필요.
- **`PATCH /events/:id`** — 갤러리 **행사 정보 수정** 미구현(생성·삭제만).
- **`DELETE /finance/fiscal-years/:id`** — 회계연도 삭제 미연결(백엔드는 softDelete라 안전). budget-view FiscalYearBar에 삭제 버튼 붙이면 됨. 단 마지막/현재 연도 삭제 가드 UX 고려.
- **`GET /finance/offerings/summary/:memberId/:year`** — 성도별 연말정산 카테고리별 합계 JSON. 현재 영수증은 PDF(`receipt`)로 충족 중이라 미사용. 화면 내 요약 표시 원하면 연결.
- **`GET /churches/me`** — 프론트 어디서도 안 씀. `auth/me`와 중복 가능성. 정리/삭제 검토.
- (참고) `GET /calendar/feed/:token`, `GET /auth/google/callback`, `GET /google-calendar/callback`은 외부/브라우저 리다이렉트용이라 fetch 미사용이 정상.

### 3.3 이전 세션에서 이월 (미터치)
- **Google Calendar push 라이브 검증**(로그인 통과): 동의화면 calendar 스코프 + 테스트 사용자 등록.
- **refreshToken 암호화**: 현재 평문(localdev). production 전 필수.
- **배포(Railway Hobby ~$5/월 결정됨)**: prod 도메인 전환 시 OAuth redirect 2개 등록, env 세팅, 마이그레이션 8개 run, JWT/S3 키 prod화. [[project_deployment_railway]]
- **⚠️ 서버 타임존**: 대시보드(주/월/오늘 범위)·`finance/dashboard`(월 범위)가 **서버 로컬타임** 기준. prod 서버 UTC면 KST와 9h 경계 어긋남 → 헌금월합계/오늘일정이 틀어질 수 있음. 배포 시 `TZ=Asia/Seoul` 고정(Railway env) 또는 tz-aware 계산으로 교체.
- S3 갤러리 `.envrc` 키 + 버킷 CORS.
- FK `ON DELETE` 미결, super admin 분리, Postgres RLS, 자동 테스트, apps/api eslint flat config 이전.

### 3.4 다음 도메인 후보
1. 알림(채널 결정 필요: 앱내/SMS/카톡).
2. 커스텀 역할(per-church) — 현재 고정 4역할.
3. 달력 양방향(개인 구글 일정 pull) — 현재 push만.

---

## 4. 중요한 결정사항과 이유

- **코드 스타일 = `.prettierrc`(semi:true)**: 단일 출처. tsx 무세미콜론은 lint-staged가 `*.ts`만 잡는 드리프트. [[feedback_code_style_prettier]]
- **분류 관리 = 헌금/운영재정 폼 인라인**(사용자 선택): 설정 페이지가 아니라 분류를 생성·사용하는 그 자리에서 편집/삭제(발견성). CategorySelect 공용, 관리 핸들러는 optional prop.
- **CategorySelect 커밋 = blur=Enter**(사용자 요청): 포커스 이탈도 Enter와 동일 적용. 단일 커밋 경로(Enter→blur 수렴)로 이중 생성 방지, Escape는 취소 플래그.
- **헌금 수정 범위 = 삭제 + 인라인(금액·분류)**(사용자 선택): 성도 변경은 삭제 후 재입력. wrong-input 교정 목적.
- **날짜 = 로컬 기준(`lib/date.ts`)**: toISOString(UTC) 금지. 새 날짜 기본값/이동은 `todayString`/`toDateString` 사용.
- **mutation은 onError 필수**: 조용한 실패(400/500 무반응) 방지. 이번 세션 재정 전반 보강.
- **미연결 백엔드 엔드포인트는 무감독 구현 보류**(§3.2): 추측 UI보다 문서화 후 설계 우선.
- (이월) 연도 범위 = 부서·사역팀·목장만 / 연도=smallint 달력연도 / 새 연도=이전 복사 / partial PATCH=PartialType / budget.targetNameMaps 전 연도 유지.

---

## 5. 다음 세션 컨텍스트

### 5.1 환경/상태
- **Postgres**: Homebrew `postgresql@14`, DB `yakirim`(`root`/`root1234`). **church id 1** = dev-login(`bhoon92@gmail.com`) 교회(owner) = 스모크 데이터. 성도 1명(박병훈, id 3).
- **헌금 분류**: church 1에 사용자가 만든 테스트 분류 다수(`헌금`·`감사`·`건축`·`테스트`·`1`·`test2` 등). 이제 헌금 폼 **편집**으로 정리 가능.
- **마이그레이션 10개**: AddReferenceYear·AddCalendarEventRecurrence·AddMemberStatus 포함 전부 적용됨. `member_status` 테이블+교회별 시드, `member.status_id` NOT NULL(`lifecycle_stage` enum 컬럼은 미사용 보존).
- **포트**: API `PORT`(기본 3030). 프론트 Vite 5173. 둘 다 기동 중.

### 5.2 ⚠️ 중요 gotchas (여전히 유효)
- **Vite 프록시가 `/api`를 떼고 보냄**(`rewrite: /^\/api/ → ''`). API는 글로벌 프리픽스 없음 → **curl 테스트 시 `/api` 붙이면 404**. 예: 헌금은 `/finance/offerings`(프론트는 `/api/finance/offerings`).
- **dev-login**: `POST http://localhost:3030/auth/dev-login -d '{"email":"bhoon92@gmail.com"}'` → 쿠키 jar. localdev 전용, 바로 church 1.
- **`nest build`(build:api)가 `dev:api`(watch)를 죽인다**: 타입체크/마이그레이션 후 dev:api 재기동 필요.
- **🔴 dev:api 백그라운드 반복 기동 금지**: `lsof -ti:3030 | xargs kill -9`는 **포트(nest 자식)만** 죽이고 `pnpm dev:api` 부모 + 파일워처는 남음. 반복하면 누적 → 시스템 전역 **"too many open files in system"**(EMFILE)으로 curl·ps까지 실패. **검증은 `pnpm build:api`로 충분**, 라이브 필요 시 하나만. 끝낼 땐 `pkill -f "dev:api"`/`pkill -f "nest start"`로 부모까지. [[feedback_devapi_background_restart]]
- **migration:generate는 `dist/**/*.entity.js`를 읽음** → 반드시 `build:api` 먼저. `ADD COLUMN NOT NULL`을 그대로 뱉으므로 기존 데이터 있으면 nullable→UPDATE 백필→NOT NULL 수동 3단계.
- **`ValidationPipe({whitelist:true})`**: 알 수 없는 필드 무시 + 필수 누락 시 400. partial 업데이트는 PartialType DTO.
- **`@Query('year', ParseIntPipe)`는 필수**(누락 400). optional은 수동 파싱(org-chart 방식).
- **lint-staged는 `*.ts`만** eslint+prettier 적용. `*.tsx`는 안 잡음 → tsc/eslint 수동 검증 필수.
- 마이그레이션: `direnv exec . pnpm migration:run` / `migration:generate <Name>`(env는 `generateEnv`가 `.env`로, direnv 필요).

### 5.3 미커밋 파일
없음 (전부 커밋됨).

### 5.4 실행 명령
```sh
pnpm dev:api / pnpm dev:web
pnpm build:api
direnv exec . pnpm migration:generate <Name>   # build:api 먼저, 생성물 손수정, 다시 build → run
direnv exec . pnpm migration:run
# 빠른 API 검증:
curl -s -c /tmp/cj.txt -X POST http://localhost:3030/auth/dev-login -H 'Content-Type: application/json' -d '{"email":"bhoon92@gmail.com"}'
curl -s -b /tmp/cj.txt "http://localhost:3030/finance/offerings?date=2026-06-14"   # /api 붙이지 말 것
# 프론트 검증: cd apps/web && npx tsc --noEmit && npx eslint src
```

### 5.5 자동 메모리 (저장됨)
멀티테넌트 / user-centric / 실시간 finance / 모바일 정책 / entity 주석 한 줄 / DTO Request·Response 명명 / 약자·한글자 금지 / 배포=Railway Hobby / 코드 스타일=prettier(semi:true).

---

## 6. 이번 세션에서 배운 것

- **`toISOString().slice(0,10)`은 날짜 버그**: UTC라 KST 밤엔 하루 밀림. 로컬 날짜는 `getFullYear/Month/Date` 조합(`lib/date.ts`). 날짜 다루는 코드 보면 이 패턴 의심.
- **조용한 실패 = onError 부재**(재확인): react-query mutation에 onError 없으면 400/500도 무반응. UI 버그 1순위 디버깅은 curl+dev-login으로 실제 HTTP 직접 찌르기(백엔드 200이면 프론트, 400이면 백엔드 — 1초컷).
- **신규 차원/기능은 소비처 전수 grep**: 이번엔 반대로 **백엔드 라우트 112개 vs 프론트 호출 전수 대조**로 미연결 엔드포인트를 찾음(§3.2). orphan 엔드포인트 = 미완 기능 신호.
- **공용 컴포넌트 확장은 optional prop**: CategorySelect의 onCreate/onUpdate/onDelete를 optional로 두니 폼(관리 노출)·행편집(선택만)·운영재정(관리) 한 컴포넌트로 재사용.
- **blur 커밋 + Enter는 단일 경로로**: Enter가 setState(unmount)하면 blur가 또 발동 → 이중 생성. Enter를 `blur()`로 수렴시키고 생성은 onBlur 한 곳에서만.
- **TypeORM `where: { id: 배열 }`은 `IN`이 아니다**: 배열을 그대로 넣으면 `id = $1`에 배열이 통째 바인딩 → Postgres `22P02 invalid input syntax for integer`. 반드시 `In(배열)`. (소속 2개 이상 크래시 원인, §1.11)
- **단서를 게으르게 넘기지 말 것**: "A설정 후 B설정 시 에러"를 재현하려 curl로 GET /members/:id 했을 때 나온 "KeyError affiliations"를 **서버 리로드 탓으로 오판**하고 넘겼는데, 그게 바로 500 크래시(위 In 버그)였음. 예상 못한 응답은 그 자체가 버그 신호 — 끝까지 파야 함.
- **enum→reference 전환은 시스템 의존을 전수 grep**: lifecycleStage가 출석 제외·영수증 익명·대시보드·export까지 박혀 있었음. "사용자 편집 가능"으로 바꿀 땐 systemKey/플래그로 시스템 동작을 보존(삭제 가드 포함).
- **모달 안 인라인 편집의 Escape는 stopPropagation**: 모달이 `window` keydown으로 Escape 닫기를 걸어두면, 안쪽 input의 Escape(취소)가 모달까지 닫아버림. input onKeyDown에서 `event.stopPropagation()` 필요(React root에서 native 전파 차단 → window 리스너 미도달).
- **필드 클리어는 null**: TypeORM `repo.update`는 `undefined` 필드를 무시 → 값 비우기 불가. 비우려면 `null` 전송(@IsOptional이 null 통과). 빈 문자열은 @Length(1,..)에 걸려 400.
- **dev:api 백그라운드 누적 = 시스템 FD 고갈**: `& > log`로 반복 기동 + 포트만 kill하면 pnpm 부모/파일워처가 쌓여 "too many open files"로 전 시스템 마비. build로 검증하고, 띄웠으면 pkill로 부모까지 정리. [[feedback_devapi_background_restart]]
- **공용 CRUD는 컴포넌트로 추출해 모달 재사용**: references 페이지를 통째로 옮기지 않고 ReferenceTab을 `ReferenceManager`로 추출 → 각 도메인 페이지 모달에서 재사용(설정 분산). IA 바꿀 때 페이지 이동 대신 추출+임베드가 깔끔.

---

## 7. 이전 세션 누적 (참고)

기반(멀티테넌트·OAuth·디자인) → 재적/소속/직분 → 심방 → 출석 → 재정(헌금·운영·예산·대시보드) → 영수증 PDF → Excel → 갤러리+S3 → 달력+iCal → RBAC/팀원 → 조직도+Google Calendar push → Google 로그인 검증 + 배포(Railway) 결정 → references CRUD 개선 + 드래그 정렬 + partial PATCH 픽스 + 연도별 편성 + 예산·소속·조직도 연도 인지화 → **(이번 긴 세션) 대시보드 실데이터(GET /dashboard) + 헌금/분류/계정과목 수정·삭제 + UTC 날짜 픽스 + 달력 반복일정 + iCal URL 단축 + 성도 검색(소속필터·디바운스) + 재적상태(단계 enum→교회별 reference) + 소속 다중배정 크래시 픽스 + access/refresh 토큰 분리 + 재적 모달 인라인 수정 + 설정을 각 기능 페이지로 분산(조직도·성도·출석·달력에 관리 모달)**.

planning.md = 살아있는 기획서(결정 출처). 도메인 모델/필드 상세는 planning.md + git log.
