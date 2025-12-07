// apps/api/src/dashboard/dto/my-work.dto.ts
import { TaskStatus } from '../../tasks/dto/task.dto';

export type MyWorkTab = 'today' | 'in_progress' | 'waiting' | 'overdue';

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
