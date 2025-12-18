// apps/web/hooks/useGanttData.ts

import { useMemo } from 'react';
import type { Project, Task } from '@/types';
import type { GanttData, GanttStage, GanttTask } from '@/types';

export function useGanttData(project: Project | null): GanttData | null {
  return useMemo(() => {
    if (!project?.stages) return null;

    const activeStages = project.stages.filter(s => s.isActive !== false);

    const ganttStages: GanttStage[] = activeStages.map(stage => {
      const activeTasks = (stage.tasks || []).filter(t => t.isActive !== false);

      const ganttTasks: GanttTask[] = activeTasks.map(task => ({
        id: task.id,
        title: task.title,
        startDate: task.startDate || null,
        dueDate: task.dueDate || null,
        completedDate: task.completedDate || null,
        status: task.status,
        progress: calculateTaskProgress(task),
        assignee: task.assignee ? { name: task.assignee.name } : null,
        stageId: stage.id,
        stageName: stage.template?.name ?? stage.id,
      }));

      return {
        id: stage.id,
        name: stage.template?.name ?? stage.id,
        order: stage.template?.order ?? 0,
        tasks: ganttTasks,
        // Include stage dates
        startDate: stage.startDate || null,
        receivedDate: stage.receivedDate || null,
        completedDate: stage.completedDate || null,
      };
    });

    const allDates = [
      ...ganttStages.flatMap(s => s.tasks).flatMap(t => [t.startDate, t.dueDate]),
      ...ganttStages.flatMap(s => [s.startDate, s.completedDate]),
    ].filter(Boolean) as string[];

    const dateRange = {
      min: allDates.length > 0
        ? new Date(Math.min(...allDates.map(d => new Date(d).getTime()))).toISOString()
        : new Date().toISOString(),
      max: allDates.length > 0
        ? new Date(Math.max(...allDates.map(d => new Date(d).getTime()))).toISOString()
        : new Date().toISOString(),
    };

    return {
      projectName: project.name,
      projectId: project.id,
      stages: ganttStages,
      dateRange,
    };
  }, [project]);
}

function calculateTaskProgress(task: Task): number {
  if (task.status === 'completed') return 100;
  if (task.status === 'in_progress') {
    if (!task.startDate || !task.dueDate) return 25;

    const start = new Date(task.startDate).getTime();
    const end = new Date(task.dueDate).getTime();
    const now = Date.now();

    if (now < start) return 0;
    if (now > end) return 90;

    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(Math.max(progress, 5), 90);
  }
  return 0;
}
