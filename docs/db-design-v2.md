# DB 설계 v2 초안

## 도메인 개념
- **Company**: 회사 단위로 사용자, 템플릿, 프로젝트를 분리. 공유 링크나 위험 점수 등의 범위도 회사로 제한.
- **User**: 회사 소속 사용자. 태스크 담당자 및 활동 로그 작성자. 역할/태그를 통한 권한과 필터링.
- **StageTemplate / TaskTemplate**: 회사별 표준 단계·태스크 정의. 프로젝트 생성 시 자동 인스턴스화의 원천 데이터.
- **Project / ProjectStage**: 실제 현장/발전소 프로젝트와 단계 진행 상태. StageTemplate의 순서를 따라가며 일정과 진행률을 기록.
- **Task / TaskHistory**: 업무 단위와 상태/담당자/코멘트 변경 로그. 필수 태스크, D-Day, 담당자 연결을 포함.
- **Document**: 프로젝트·태스크에 첨부되는 서류. 버전(revision), 만료일, 보완 여부, 유형 필드 포함.
- **Notification**: 오늘 마감, 만료 예정, 지연 위험 등 사용자별 알림 인스턴스.
- **DelayRiskScore**: 프로젝트 지연 위험도 점수. 대시보드의 위험 프로젝트 위젯에 사용.
- **ShareLink / Photo**: 기존 스키마에서 유지. 외부 공유와 현장 사진 관리용.

## 엔티티별 필드 (필수/선택/인덱스 제안)

### Company
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| name | String | Y | 회사명 |  |
| tags | String[] | N | 회사 분류 태그 |  |
| deletedAt | DateTime | N | Soft delete | INDEX |
| createdAt / updatedAt | DateTime | Y | 생성/수정일 |  |

관계: Company 1:N User, Project, StageTemplate, ShareLink.

### User
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| email | String | Y | 로그인 이메일 | UNIQUE, INDEX |
| name | String | N | 사용자명 |  |
| role | String | Y | admin/manager/member |  |
| companyId | String | Y | 소속 회사 | INDEX |
| magicLinkToken / magicLinkExpires | String / DateTime | N | 임시 로그인 토큰 | UNIQUE (token) |
| tags | String[] | N | 역할/스킬 태그 |  |
| deletedAt | DateTime | N | Soft delete | INDEX |
| createdAt / updatedAt | DateTime | Y | 생성/수정일 |  |

관계: User N:1 Company, 1:N Task (assignee), 1:N TaskHistory, 1:N Notification.

### StageTemplate
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| companyId | String | Y | 회사별 템플릿 구분 | UNIQUE(companyId, name), INDEX |
| name | String | Y | 단계명 |  |
| description | String | N | 설명 |  |
| order | Int | Y | 단계 순서 |  |
| deletedAt | DateTime | N | Soft delete | INDEX |
| createdAt / updatedAt | DateTime | Y | 생성/수정일 |  |

관계: StageTemplate 1:N TaskTemplate, 1:N ProjectStage.

### TaskTemplate
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| stageTemplateId | String | Y | 소속 단계 템플릿 | INDEX |
| title | String | Y | 태스크 제목 |  |
| description | String | N | 기본 설명 |  |
| isMandatory | Boolean | Y | 필수 여부 |  |
| defaultDueDays | Int | N | 기준일 대비 D-day 오프셋 |  |
| defaultAssigneeRole | String | N | 기본 담당 역할 |  |
| order | Int | Y | 태스크 순서 |  |
| deletedAt | DateTime | N | Soft delete | INDEX |
| createdAt / updatedAt | DateTime | Y | 생성/수정일 |  |

관계: TaskTemplate N:1 StageTemplate.

### Project
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| companyId | String | Y | 소속 회사 | INDEX |
| name | String | Y | 프로젝트명 |  |
| address | String | N | 현장 주소 |  |
| capacityKw | Float | N | 발전 용량(kW) |  |
| status | String | Y | planning/in_progress/completed/on_hold | INDEX |
| targetDate | DateTime | N | 목표 준공일 |  |
| permitNumber | String | N | 발전사업허가 번호 | INDEX |
| inspectionDate | DateTime | N | 사용전검사 예정일 |  |
| constructionStartAt | DateTime | N | 착공일 |  |
| externalId | String | N | 외부 시스템 연동 ID | INDEX |
| tags | String[] | N | 특성 태그 |  |
| deletedAt | DateTime | N | Soft delete | INDEX |
| createdAt / updatedAt | DateTime | Y | 생성/수정일 |  |

관계: Project N:1 Company, 1:N ProjectStage, Document, ShareLink, DelayRiskScore.

### ProjectStage
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| projectId | String | Y | 소속 프로젝트 | INDEX |
| templateId | String | Y | StageTemplate 참조 | UNIQUE(projectId, templateId), INDEX |
| status | String | Y | pending/active/completed | INDEX |
| startedAt | DateTime | N | 실제 시작일 |  |
| submittedAt | DateTime | N | 인허가 접수일 | INDEX |
| completedAt | DateTime | N | 완료일 |  |
| plannedStartAt | DateTime | N | 계획 시작일 |  |
| plannedDueAt | DateTime | N | 단계 예상 완료일 | INDEX |
| deletedAt | DateTime | N | Soft delete | INDEX |
| createdAt / updatedAt | DateTime | Y | 생성/수정일 |  |

관계: ProjectStage N:1 Project, N:1 StageTemplate, 1:N Task.

### Task
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| projectStageId | String | Y | 소속 단계 | INDEX |
| templateId | String | N | 원본 TaskTemplate | INDEX |
| title | String | Y | 태스크 제목 |  |
| description | String | N | 상세 설명 |  |
| status | String | Y | pending/in_progress/completed/delayed | INDEX |
| dueDate | DateTime | N | 마감일 | INDEX |
| isMandatory | Boolean | Y | 필수 여부 |  |
| assigneeId | String | N | 담당자 | INDEX |
| progress | Int | N | 0~100 진행률 |  |
| priority | String | N | low/medium/high/urgent | INDEX |
| tags | String[] | N | 필터 태그 |  |
| deletedAt | DateTime | N | Soft delete | INDEX |
| createdAt / updatedAt | DateTime | Y | 생성/수정일 |  |

관계: Task N:1 ProjectStage, N:1 User(assignee), N:1 TaskTemplate, 1:N TaskHistory, Photo, Document.

### TaskHistory
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| taskId | String | Y | 관련 태스크 | INDEX |
| userId | String | Y | 작성자 | INDEX |
| action | String | Y | created/status_changed/assignee_changed/comment |  |
| oldValue | String | N | 이전 값 |  |
| newValue | String | N | 새 값 |  |
| comment | String | N | 코멘트 |  |
| createdAt | DateTime | Y | 기록 시각 | INDEX |

관계: TaskHistory N:1 Task, N:1 User.

### Document
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| projectId | String | Y | 소속 프로젝트 | INDEX |
| taskId | String | N | 관련 태스크 | INDEX |
| fileName / fileUrl | String | Y | 파일 정보 |  |
| fileSize | Int | N | 바이트 |  |
| mimeType | String | N | MIME 타입 |  |
| revision | Int | Y | 버전 번호 |  |
| parentId | String | N | 이전 버전 |  |
| isSupplementary | Boolean | Y | 보완 서류 여부 |  |
| expiryDate | DateTime | N | 만료일 | INDEX |
| docType | String | N | permit/certificate 등 |  |
| externalId | String | N | 외부 문서 ID | INDEX |
| tags | String[] | N | 유형 태그 |  |
| deletedAt | DateTime | N | Soft delete | INDEX |
| createdAt / updatedAt | DateTime | Y | 생성/수정일 |  |

관계: Document N:1 Project, N:1 Task.

### Notification
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| userId | String | Y | 수신자 | INDEX |
| projectId | String | N | 관련 프로젝트 | INDEX |
| taskId | String | N | 관련 태스크 | INDEX |
| type | String | Y | due_today/due_in_7/expiry_30/delay_risk 등 | INDEX |
| title | String | Y | 알림 제목 |  |
| message | String | Y | 상세 메시지 |  |
| isRead | Boolean | Y | 읽음 여부 | INDEX |
| createdAt | DateTime | Y | 생성일 | INDEX |

관계: Notification N:1 User, (옵션) Project, Task.

### DelayRiskScore
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| projectId | String | Y | 대상 프로젝트 | INDEX |
| score | Int | Y | 0~100 위험 점수 | INDEX |
| severity | String | Y | low/medium/high/critical | INDEX |
| overdueTaskCount | Int | Y | 기한 초과 태스크 수 |  |
| upcomingTaskCount | Int | Y | 7일 내 마감 태스크 수 |  |
| completionRate | Float | Y | 완료율 |  |
| maxDelayDays | Int | Y | 최장 지연 일수 |  |
| factors | String[] | Y | 위험 요인 설명 |  |
| calculatedAt | DateTime | Y | 계산 시각 | INDEX |

관계: DelayRiskScore N:1 Project.

### Photo
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| taskId | String | Y | 관련 태스크 | INDEX |
| fileName / fileUrl | String | Y | 파일 정보 |  |
| fileSize | Int | N | 바이트 |  |
| latitude / longitude | Float | N | GPS |  |
| description | String | N | 설명 |  |
| takenAt | DateTime | Y | 촬영 시각 | INDEX |
| tags | String[] | N | 태그 |  |
| deletedAt | DateTime | N | Soft delete | INDEX |
| createdAt | DateTime | Y | 업로드 시각 |  |

관계: Photo N:1 Task.

### ShareLink
| 필드 | 타입 | 필수 | 설명 | 인덱스/제약 |
| --- | --- | --- | --- | --- |
| id | String (cuid) | Y | PK | PK |
| projectId | String | Y | 대상 프로젝트 | INDEX |
| token | String | Y | 접근 토큰 | UNIQUE, INDEX |
| password | String | N | 해시 비밀번호 |  |
| expiresAt | DateTime | N | 만료일 |  |
| allowedStages | String[] | Y | 공유 단계 제한 |  |
| viewCount | Int | Y | 조회수 |  |
| lastViewedAt | DateTime | N | 마지막 조회 |  |
| externalId | String | N | 외부 공유 ID | INDEX |
| tags | String[] | N | 태그 |  |
| deletedAt | DateTime | N | Soft delete | INDEX |
| createdAt / updatedAt | DateTime | Y | 생성/수정일 |  |

관계: ShareLink N:1 Project.

## 관계 다이어그램 (텍스트)
```
Company 1---N User
Company 1---N Project
Company 1---N StageTemplate
Project 1---N ProjectStage
StageTemplate 1---N TaskTemplate
ProjectStage 1---N Task
TaskTemplate 1---N Task (templateId)
Task 1---N TaskHistory
Task 1---N Document
Task 1---N Photo
Project 1---N Document
Project 1---N ShareLink
Project 1---N DelayRiskScore
User 1---N Notification
```

## 기존 스키마 대비 제안 변경 요약
- **Stage/Task 템플릿**: TaskTemplate에 `defaultAssigneeRole` 추가, StageTemplate/TaskTemplate의 순서(order) 유지.
- **ProjectStage**: 접수일(submittedAt), 계획 일정(plannedStartAt, plannedDueAt) 추가. 기존 startDate/receivedDate/completedDate는 정리하고 startedAt/submittedAt/completedAt으로 통일.
- **Task**: 진행률(progress), 우선순위(priority) 추가. status는 delayed 상태 유지. dueDate 인덱스 유지.
- **Document**: 만료일/버전/보완 여부 유지. docType, externalId 인덱스 유지.
- **DelayRiskScore**: 위험 요인 상세(factors)와 지연 일수(maxDelayDays) 유지, 점수/심각도 인덱스 유지.
- **공통 필드**: `deletedAt`, `tags`, `externalId`(필요한 엔티티) 유지하여 회사/프로젝트별 필터링과 연동 확장성 확보.
```
