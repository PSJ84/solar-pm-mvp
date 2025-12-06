# UI 와이어프레임 v2 (텍스트)

## /dashboard
- **헤더**: 회사 선택(옵션), 날짜 범위 요약.
- **필터 바**: 프로젝트 상태, 담당자, 지역(태그 기반) 필터.
- **위젯 배치 (2열 카드)**
  - 오늘 마감 태스크 카드
    - 리스트: 태스크 제목 / 프로젝트명 / 단계명 / 담당자 / 마감일 / 상태 토글.
    - CTA: "전체 보기" → `/tasks?filter=today`.
  - 7일 예정 태스크 카드
    - 요약 KPI: 총 예정 개수, 완료율, 담당자별 카운트.
    - 리스트: D+1~D+7 태스크 행, dueDate, assignee, mandatory 여부.
    - CTA: `/tasks?filter=upcoming`.
  - 지연 위험 프로젝트 카드
    - Top N 프로젝트: 프로젝트명, 점수, severity badge, 주요 요인(factors) 텍스트.
    - CTA: `/projects?filter=risk`.
  - 문서 만료 임박 카드
    - 리스트: docType, 프로젝트/태스크, 만료일, revision, isSupplementary.
    - CTA: `/documents?filter=expiry30` (추후 구현용).
- **TodayWidget/RiskProjectsBanner 재사용**: 기존 컴포넌트 유지, 데이터 필드는 Task.dueDate, Task.status, DelayRiskScore.score/severity, Document.expiryDate.

## /projects
- **상단 바**: 검색(프로젝트명/주소), 필터(상태, 지역 태그, 용량 범위, 담당자), 새 프로젝트 버튼(`/projects/new`).
- **컨텐츠**: 카드 그리드
  - 카드 정보: 이름, 주소, capacityKw, status badge, 진행률(완료 태스크/전체), 지연 위험 배지(DelayRiskScore.severity), 주요 일정(inspectionDate/targetDate).
  - 액션: 상세 보기(`/projects/[id]`), 공유 링크 생성, 복제(템플릿 기반 새 프로젝트 생성).

## /projects/[id]
- **상단 정보 패널**
  - 좌: 프로젝트 기본 정보 (name, address, capacityKw, permitNumber, status, tags).
  - 우: 진행률 바(전체 완료율), 공유/복제 버튼, 위험 점수(DelayRiskScore.score + severity badge).
- **좌측 사이드바**: 단계 리스트(ProjectStage)
  - 각 단계: StageTemplate.name, 상태 아이콘, 완료 태스크/전체 태스크 카운트, 예정 완료일(plannedDueAt), 접수일(submittedAt).
  - 단계 선택 시 중앙 패널 업데이트.
- **중앙 메인 패널**: 선택된 단계의 태스크 테이블
  - 컬럼: title, assignee, dueDate, status toggle, isMandatory, attachments 존재 여부, progress(%) 바, priority.
  - 상단 필터: 담당자, 상태, 필수/선택, dueDate 범위.
  - 태스크 추가 버튼: 템플릿 기반 생성 또는 수동 추가.
- **우측 패널**
  - 활동 로그(TaskHistory): 최근 변경 20개, action/사용자/시간/코멘트.
  - 최근 문서/사진: 해당 단계 내 최신 Document/Photo 썸네일/파일명.
  - 단계 일정 편집: startedAt, submittedAt, completedAt, plannedStartAt, plannedDueAt 입력 UI.

## /templates
- **상단**: 회사 선택 드롭다운, 새 StageTemplate 추가 버튼.
- **레이아웃 (3열)**
  - 좌측 컬럼: StageTemplate 리스트
    - 드래그 앤 드롭으로 order 변경, 각 항목에 name/태스크 수/사용 프로젝트 수 표시.
  - 중앙 컬럼: 선택된 StageTemplate의 TaskTemplate 리스트
    - 테이블: title, isMandatory, defaultDueDays, defaultAssigneeRole, order.
    - 추가/삭제/순서 변경 버튼.
  - 우측 컬럼: TaskTemplate 상세 에디터
    - 필드: title, description, isMandatory, defaultDueDays, defaultAssigneeRole, tags, 첨부 필요 여부 체크(향후 확장).
    - 실시간 저장/미리보기.

## /tasks
- **탭 네비게이션**: 오늘(`/tasks?filter=today`), 이번 주(`/tasks?filter=upcoming`), 지연(`/tasks?filter=delayed`), 전체(`/tasks`).
- **필터 바**: 프로젝트, 단계(ProjectStage), 담당자(User), 우선순위, 필수/선택, 태그.
- **태스크 리스트 (테이블)**
  - 컬럼: title, project name, stage name, dueDate, status toggle, assignee avatar, priority, isMandatory, attachments indicator, progress bar.
  - 정렬: dueDate, priority, project, stage.
  - 상태 변경/담당자 변경 인라인 액션 제공.

## 추가 참고
- 모든 리스트는 회사 ID 컨텍스트 기반 페칭.
- Today/Upcoming 집계는 Task.status + dueDate, DelayRiskScore.severity, Document.expiryDate로 계산.
