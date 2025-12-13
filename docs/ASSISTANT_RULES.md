# ASSISTANT_RULES (Solar PM)

이 문서는 Solar PM 리포지토리에서 **AI(Codex/ChatGPT/Claude 등)**에게 작업을 시킬 때의 **고정 규칙**과 **작업 방식**을 정의한다.  
GitHub에서 그대로 복사/붙여넣기하여 사용한다.

---

## 0) 절대 규칙 (응답 포맷)

- 내가 “프롬프트 작성”을 요청하면, **응답은 항상 ` ```md ... ``` ` 코드블록 1개만** 출력한다.
- 코드블록 **밖에 설명/잡담/추가 문장 금지**.
- 프롬프트는 항상 아래 섹션을 포함한다:
  - **[TASK] 제목**
  - **목표**
  - **변경 범위**
  - **수용 기준(완료 조건)**
  - **구현 순서(권장)**
  - **작업 후 보고(변경 파일/핵심 로직 위치)**

---

## 1) 제품 목표 (족쇄 시스템)

- 1인/소규모 팀 태양광 인허가/시공 PM 도구
- ADHD 성향 대응: “기록만 하고 안 보는 앱” 금지  
  → **위험 큐 + 자동 Big3 + 알림 + Snooze(이유 기록)** 중심으로 설계
- 무료/저비용 인프라 유지: Vercel(Web) + Railway(API) + Supabase(DB)

---

## 2) 우선순위 로드맵 (현재 합의)

### Phase 1: 위험 큐 대시보드 + Big3 자동 선정
- Risk Queue API에서 계산해서 내려주기(프론트에 로직 분산 금지)
- Big3 우선순위: Overdue > D-day > D-1 > (옵션) 체크리스트 미완+임박
- `snoozeUntil > now`는 Big3/위험 큐에서 제외
- `needsDueDate`(마감일 없는 위험 태스크) 큐 포함

### Phase 2: 모닝 브리핑(매일 8시 KST, 이메일 1통)
- GitHub Actions cron + Resend
- NotificationLog로 멱등성(중복 발송 방지) 보장

### Phase 3: Snooze 시스템
- Dismiss 금지, Snooze만 허용
- Snooze 이유 3버튼 + 선택 메모
- snoozeUntil이 지나면 위험 큐에 재등장

### Phase 4: 개별 마감 알림(D-1/D-day)
- Phase 2 구조 재사용
- NotificationLog로 중복 방지

### Phase 5: 서류 만료 알림(D-14/D-7)
- Document/Attachment 레벨 expiresAt 관리(가능하면)
- 브리핑에 “만료 임박 서류” 섹션 고정

---

## 3) 모바일 UX 원칙 (필수)

- 글로벌 메뉴(대시보드/프로젝트/템플릿): **모바일은 하단 탭바(BottomNav)**
- 프로젝트 상세:
  - 좌측 “인허가 단계 리스트”는 **모바일에서 드로어/시트로 선택**
  - 우측 로그 컬럼은 **모바일에서는 숨김 유지**
- Desktop(>= md)은 기존 레이아웃 유지, mobile(< md)만 변경
- 표(table) 중심 UI 금지 → 카드/리스트 위주

---

## 4) API/DB/성능 원칙 (Free tier 안정)

- Prisma `include` 남발 금지 → `select`로 필요한 필드만
- 큰 `Promise.all` / 긴 트랜잭션 지양 (Railway connection pool 고려)
- 엔드포인트는 “항상 예측 가능한 형태”로:
  - 빈 상태는 200 + `[]` / 기본 객체 반환 (404로 UI 깨지게 하지 않기)
- 에러는 “무반응” 금지:
  - FE: 토스트/에러 메시지
  - BE: 일관된 예외 포맷

---

## 5) NotificationLog 멱등성 규칙(중복 방지)

> Postgres에서 nullable unique 조합은 중복 방지에 취약할 수 있으므로, `scopeKey`를 사용한다.

- Task 알림: `scopeKey = "TASK:<taskId>"`
- 모닝 브리핑: `scopeKey = "USER:<userId>"`

권장 유니크 키:
- `@@unique([userId, type, dateKey, scopeKey])`

---

## 6) 문서 스타일 규칙

- 문서 작성 시 `:`(콜론) 앞뒤에 항상 띄어쓰기  
  예) `제목 : 내용`

---

## 7) PR/커밋 규칙 (간단)

- 커밋 메시지 형식: `feat: ...` / `fix: ...` / `refactor: ...`
- 작업 완료 후 반드시 보고:
  - 변경 파일 목록
  - 핵심 로직 위치(함수/컴포넌트 경로)
  - 수동 테스트 시나리오 3개

---
