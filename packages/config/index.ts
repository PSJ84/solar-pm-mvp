// packages/config/index.ts

// ===========================
// 상태 상수
// ===========================

export const PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
} as const;

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELAYED: 'delayed',
} as const;

export const STAGE_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

export const RISK_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// ===========================
// 태양광 인허가 단계 기본 템플릿
// ===========================

export const DEFAULT_STAGE_TEMPLATES = [
  { name: '사업타당성 검토', order: 1 },
  { name: '발전사업허가', order: 2 },
  { name: '개발행위허가', order: 3 },
  { name: '건축/공작물 허가', order: 4 },
  { name: '착공신고', order: 5 },
  { name: '전력수급계약', order: 6 },
  { name: '사용전검사', order: 7 },
  { name: '상업운전', order: 8 },
] as const;

// ===========================
// 환경설정
// ===========================

export const CONFIG = {
  // 페이지네이션
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // 파일 업로드
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOC_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],

  // 인증
  MAGIC_LINK_EXPIRY_MINUTES: 30,
  JWT_EXPIRY_DAYS: 7,

  // 알림
  DUE_REMINDER_DAYS: [7, 3, 1, 0], // D-7, D-3, D-1, D-day
  EXPIRY_REMINDER_DAYS: [30, 14, 7], // 문서 만료 알림
} as const;

// ===========================
// 타입 export (TypeScript)
// ===========================

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];
export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];
export type StageStatus = typeof STAGE_STATUS[keyof typeof STAGE_STATUS];
export type RiskSeverity = typeof RISK_SEVERITY[keyof typeof RISK_SEVERITY];
