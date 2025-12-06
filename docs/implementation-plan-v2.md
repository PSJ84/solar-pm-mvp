# 구현 우선순위 v2

## 1단계 (필수)
- **백엔드 (Prisma/Nest)**
  - StageTemplate/TaskTemplate 기반 ProjectStage/Task 자동 생성 서비스 구현 (프로젝트 생성 시 호출).
  - Task.status, dueDate 인덱스 활용해 Today/Upcoming 조회 API 정리.
  - DelayRiskScore 최신 1건을 프로젝트별로 계산/저장하는 배치 초안.
- **프론트 (Next.js)**
  - /projects/[id]에서 단계/태스크 리스트를 템플릿 순서대로 렌더링하고 상태/담당자/마감일 인라인 업데이트.
  - /dashboard Today/Upcoming 위젯을 공용 Task fetch API와 연결, 지연 위험/만료 임박 카드 Mock → 실제 데이터 연동.
  - /tasks 탭/필터 UI 기본 구현, Today/Upcoming/Delayed 필터 동작.
- **마이그레이션/데이터 이전**
  - ProjectStage에 submittedAt, plannedStartAt, plannedDueAt 컬럼 추가 시 기존 데이터는 NULL 기본.
  - Task에 progress, priority 컬럼 추가 시 기본 NULL 또는 default 0.

## 2단계 (중요)
- **백엔드**
  - 단계 일정 편집 API(Plan/Actual) 및 활동 로그(TaskHistory) 자동 기록.
  - DelayRiskScore 계산 로직 확정: 연체일수, 완료율, 우선순위 반영. 프로젝트 상태 변화 시 재계산 트리거.
  - 지연 프로젝트 리스트 API(`/projects?filter=risk`) 추가.
- **프론트**
  - /projects/[id] 우측 패널에 단계 일정 편집 UI 연동, 변경 시 로그/알림 생성.
  - /dashboard 지연 위험 카드에 상세 팝오버(요인, 지연 태스크 링크) 추가.
  - /templates 페이지에서 Stage/TaskTemplate 순서 변경 및 기본 담당 역할 설정 UI 구현.
- **마이그레이션/데이터 이전**
  - DelayRiskScore에 추가 지표 필요 시 필드 확장(계산 이력 유지). 기존 행은 기본값으로 채움.

## 3단계 (추가)
- **백엔드**
  - Document.expiryDate 기반 만료 알림 배치 + Notification 생성. 읽음 처리 API 개선.
  - ShareLink 권한/만료 고도화(비밀번호 정책, 단계별 제한 적용) 및 Audit 로그 추가.
- **프론트**
  - Notification 센터 UI 개선(필터/읽음 처리 일괄), 문서 만료 알림 카드와 연동.
  - 프로젝트 공유 보기에서 단계 제한/만료 표시.
- **마이그레이션/데이터 이전**
  - Notification/ShareLink 관련 추가 필드(예: lastNotifiedAt, accessScope) 도입 시 기존 데이터 기본값 처리.
