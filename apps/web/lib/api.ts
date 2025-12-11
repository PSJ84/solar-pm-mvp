// apps/web/lib/api.ts
import axios from 'axios';
import type { TemplateDetailDto, TemplateListItemDto } from '../../../packages/shared/src/types/template.types';
import type { MyWorkTaskDto } from '@/types/dashboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const normalizedApiBase = (() => {
  const trimmed = API_URL.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) {
    return trimmed;
  }
  return `${trimmed}/api`;
})();

export const api = axios.create({
  baseURL: normalizedApiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인증 토큰 인터셉터
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 에러 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('API 401 Unauthorized', error.response?.data);
      // TODO: 나중에 진짜 로그인 페이지 만들고 여기서 redirect 처리
    }
    return Promise.reject(error);
  },
);

// ===========================
// 타입 정의
// ===========================

export interface TaskSummaryItem {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  dueDate: string | null;
  status: string;
  isMandatory: boolean;
  stageName?: string;
}

export interface ExpiringDocumentItem {
  id: string;
  fileName: string;
  projectId: string;
  projectName: string;
  docType: string | null;
  expiryDate: string | null;
  daysUntilExpiry: number;
}

export interface RiskProjectItem {
  projectId: string;
  projectName: string;
  riskScore: number;
  delayDays: number;
  severity: string;
  factors: string[];
  overdueTaskCount: number;
  completionRate: number;
}

export interface DashboardFullSummary {
  todayTasks: TaskSummaryItem[];
  upcoming7Days: TaskSummaryItem[];
  expiringDocuments: ExpiringDocumentItem[];
  riskProjects: RiskProjectItem[];
  stats: {
    totalProjects: number;
    inProgressProjects: number;
    totalMyTasks: number;
    completedMyTasks: number;
    todayDueCount: number;
    riskProjectCount: number;
  };
}

// ===========================
// API 함수들
// ===========================

// Auth
export const authApi = {
  requestMagicLink: (email: string) =>
    api.post('/auth/magic-link', { email }),
  verifyMagicLink: (token: string) =>
    api.post('/auth/verify', { token }),
  getMe: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  // [v1.1] 통합 Summary API
  getFullSummary: () => api.get<DashboardFullSummary>('/dashboard/full-summary'),
  getMyWork: (tab?: string) =>
    api.get<MyWorkTaskDto[]>('/dashboard/my-work', {
      params: tab ? { tab } : {},
    }),
  // 기존 API들 (하위 호환)
  getSummary: () => api.get('/dashboard/summary'),
  getTodayTasks: () => api.get('/dashboard/today'),
  getUpcomingTasks: (days = 7) => api.get(`/dashboard/upcoming?days=${days}`),
  getRiskProjects: () => api.get('/dashboard/risk-projects'),
};

// Projects
export const projectsApi = {
  getAll: () => api.get('/projects'),
  getOne: (id: string, options?: { includeInactive?: boolean }) => {
    const query = options?.includeInactive ? '?includeInactive=true' : '';
    return api.get(`/projects/${id}${query}`);
  },
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getActivityLog: (id: string, limit = 20) =>
    api.get(`/projects/${id}/activity-log?limit=${limit}`),
  // [v1.1] 프로젝트 복제
  clone: (id: string, data?: { name?: string; copyAssignees?: boolean }) =>
    api.post<{ id: string; name: string }>(`/projects/${id}/clone`, data || {}),
  addStageFromTemplate: (projectId: string, data: { templateId: string; afterStageId?: string }) =>
    api.post(`/projects/${projectId}/stages/from-template`, data),
};

// Tasks
export const tasksApi = {
  getOne: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  createFromTemplate: (stageId: string, templateId: string) =>
    api.post(`/tasks/stages/${stageId}/tasks/from-template/${templateId}`),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  updateStatus: (id: string, status: string, comment?: string) =>
    api.patch(`/tasks/${id}/status`, { status, comment }),
  updateActive: (id: string, isActive: boolean) =>
    api.patch(`/tasks/${id}/active`, { isActive }),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  getAvailableTaskTemplates: (stageId: string) =>
    api.get(`/tasks/stages/${stageId}/available-templates`),
};

// Stages
export const stagesApi = {
  updateDates: (
    id: string,
    data: { startDate?: string | null; receivedDate?: string | null; completedDate?: string | null },
  ) => api.patch(`/stages/${id}/dates`, data),
  updateActive: (id: string, isActive: boolean) =>
    api.patch(`/stages/${id}/active`, { isActive }),
};

// Templates
export const templatesApi = {
  getAll: () => api.get<TemplateListItemDto[]>('/templates'),
  getOne: (id: string) => api.get<TemplateDetailDto>(`/templates/${id}`),
  updateStructure: (id: string, data: any) => api.patch<TemplateDetailDto>(`/templates/${id}/structure`, data),
  linkChecklistTemplate: (taskTemplateId: string, checklistTemplateId: string | null) =>
    api.patch(`/templates/task-templates/${taskTemplateId}/checklist-template`, { checklistTemplateId }),
  create: (data: { name: string; description?: string }) => api.post<TemplateDetailDto>('/templates', data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  reorder: (templateIds: string[]) => api.patch('/templates/reorder', { templateIds }),
};

// Share Links
export const shareLinksApi = {
  create: (data: any) => api.post('/share-links', data),
  getByProject: (projectId: string) => api.get(`/share-links/project/${projectId}`),
  delete: (id: string) => api.delete(`/share-links/${id}`),
  // 외부 접근 (인증 불필요)
  viewByToken: (token: string, password?: string) =>
    api.get(`/share-links/view/${token}${password ? `?password=${password}` : ''}`),
};

// Notifications
export const notificationsApi = {
  getAll: (unreadOnly = false) =>
    api.get(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};
