export type MyWorkTab = 'today' | 'in_progress' | 'waiting' | 'overdue';

export type TaskStatus = 'pending' | 'in_progress' | 'waiting' | 'completed' | 'delayed';

export interface MyWorkTaskDto {
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  stageId: string;
  stageName: string;
  status: TaskStatus;
  dueDate: string | null;
  dDay: number | null;
  waitingFor?: string | null;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: TaskStatus | string;
  dueDate: string | null;
  project?: { id: string; name: string } | null;
  stage?: { id: string; name?: string | null } | null;
}

export interface TomorrowDashboardResponse {
  date: string;
  big3: TaskSummary[];
  dueTomorrow: TaskSummary[];
  overdue: TaskSummary[];
  dueToday: TaskSummary[];
}
