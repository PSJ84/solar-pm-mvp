// apps/web/types/index.ts

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  companyId: string;
  companyName?: string;
}

export interface Project {
  id: string;
  name: string;
  address?: string;
  capacityKw?: number;
  status: ProjectStatus;
  progress: number;
  totalTasks?: number;
  completedTasks?: number;
  targetDate?: string | null;
  stages?: ProjectStage[];
  shareLinks?: ShareLink[];
  projectVendors?: ProjectVendor[];
  permitNumber?: string;
  inspectionDate?: string | null;
  constructionStartAt?: string | null;
  externalId?: string;
  sitePassword?: string;
  siteAccessCode?: string;
  siteNote?: string | null;
  businessLicenseNo?: string;
  devPermitNo?: string;
  kepcoReceiptNo?: string;
  farmlandPermitNo?: string;
  landAddress?: string;
  landOwner?: string;
  landLeaseRate?: number | null;
  ppaPrice?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold';

export type VendorRole =
  | 'structure'
  | 'electrical'
  | 'electrical_design'
  | 'structural_review'
  | 'epc'
  | 'om'
  | 'finance'
  | 'other';

export interface Vendor {
  id: string;
  name: string;
  contact?: string | null;
  bizNo?: string | null;
  bankAccount?: string | null;
  address?: string | null;
  memo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectVendor {
  id: string;
  role: VendorRole;
  contactName?: string | null;
  contactPhone?: string | null;
  memo?: string | null;
  vendor?: Vendor | null;
}

export interface ProjectStage {
  id: string;
  status: string;
  isActive?: boolean;
  startDate?: string | null;
  receivedDate?: string | null;
  completedDate?: string | null;
  template: {
    id: string;
    name: string;
    order: number;
  };
  tasks: Task[];
  derivedStatus?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  memo?: string;
  dueDate?: string | null;
  notificationEnabled?: boolean;
  reminderIntervalMin?: number;
  lastNotifiedAt?: string | null;
  status: TaskStatus;
  isActive?: boolean;
  isMandatory: boolean;
  projectStageId?: string;
  startDate?: string | null;
  completedDate?: string | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  checklistSummary?: {
    total: number;
    completed: number;
    progress: number;
  };
  _count?: {
    photos: number;
    documents: number;
  };
  project?: {
    id: string;
    name: string;
  };
  stage?: string;
}

export interface MyTaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
  dDay?: number | null;
  project?: {
    id: string;
    name: string;
  } | null;
  stage?: {
    id: string;
    name: string;
  } | null;
}

export type TaskStatus = 'pending' | 'in_progress' | 'waiting' | 'completed';

export interface TaskHistory {
  id: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  user: {
    id: string;
    name: string;
  };
  task: {
    id: string;
    title: string;
  };
  createdAt: string;
}

export interface RiskProject {
  id: string;
  name: string;
  address?: string;
  status: string;
  riskScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  overdueTaskCount: number;
  completionRate: number;
}

export interface ShareLink {
  id: string;
  token: string;
  expiresAt?: string;
  viewCount: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  projectId?: string;
  taskId?: string;
  createdAt: string;
}

export interface DashboardSummary {
  projects: {
    total: number;
    byStatus: Record<string, number>;
  };
  myTasks: {
    total: number;
    byStatus: Record<string, number>;
  };
  todayDue: number;
  riskProjectCount: number;
}

export interface TodayTasksResponse {
  count: number;
  tasks: Task[];
}

export interface GanttTask {
  id: string;
  title: string;
  startDate: string | null;
  dueDate: string | null;
  completedDate: string | null;
  status: TaskStatus;
  progress: number;  // 0-100
  assignee?: {
    name: string;
  } | null;
  stageId: string;
  stageName: string;
}

export interface GanttStage {
  id: string;
  name: string;
  order: number;
  tasks: GanttTask[];
}

export interface GanttData {
  projectName: string;
  projectId: string;
  stages: GanttStage[];
  dateRange: {
    min: string;
    max: string;
  };
}