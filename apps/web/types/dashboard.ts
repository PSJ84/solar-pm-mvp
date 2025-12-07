export type MyWorkTab = 'today' | 'in_progress' | 'waiting' | 'overdue';

export type TaskStatus = 'pending' | 'in_progress' | 'waiting' | 'completed';

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
