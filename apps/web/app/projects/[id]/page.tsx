'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  MapPin,
  Zap,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Copy,
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, STATUS_LABELS, formatRelativeTime, getProgressColor } from '@/lib/utils';
import { projectsApi, stagesApi, tasksApi, templatesApi } from '@/lib/api';
import { ChecklistPanel } from '@/components/checklist/ChecklistPanel';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import type { Project, ProjectStage, Task, TaskHistory, TaskStatus } from '@/types';
import type { TemplateListItemDto } from '../../../../../packages/shared/src/types/template.types';

type DerivedStage = ProjectStage & { derivedStatus: string };

type StageDateField = 'startDate' | 'receivedDate' | 'completedDate';

const deriveStageStatus = (stage: ProjectStage): string => {
  if (stage.isActive === false) return 'inactive';

  const tasks = (stage.tasks || []).filter((t) => t.isActive !== false);

  if (tasks.length > 0) {
    const completedCount = tasks.filter((t) => t.status === 'completed').length;
    const hasInProgress = tasks.some((t) => t.status === 'in_progress');

    if (completedCount === tasks.length) return 'completed';
    if (hasInProgress || completedCount > 0) return 'active';
    return 'pending';
  }

  return 'pending';
};

const calculateTaskStats = (stages?: ProjectStage[] | DerivedStage[]) => {
  const activeStages = stages?.filter((stage) => stage.isActive !== false) || [];
  const allTasks = activeStages.flatMap((stage) => (stage.tasks || []).filter((task) => task.isActive !== false));
  const completedTasks = allTasks.filter((task) => task.status === 'completed');
  const totalTasks = allTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  return { totalTasks, completedTasks: completedTasks.length, progress };
};

const recalcProjectData = (project: Project, stages: ProjectStage[] = []) => {
  const stagesWithDerived: DerivedStage[] = stages.map((stage) => ({
    ...stage,
    derivedStatus: deriveStageStatus(stage),
  }));

  const stats = calculateTaskStats(stagesWithDerived);

  return {
    ...project,
    stages: stagesWithDerived,
    totalTasks: stats.totalTasks,
    completedTasks: stats.completedTasks,
    progress: stats.progress,
  };
};

const normalizeDateInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const isLongMemo = (value?: string | null) => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  const lineCount = trimmed.split(/\r?\n/).length;
  return lineCount > 3 || trimmed.length > 120;
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const idValue = params?.id;
  const projectId = Array.isArray(idValue) ? idValue[0] : idValue ? String(idValue) : '';
  const hasProjectId = Boolean(projectId);

  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialTaskId = searchParams?.get('task') || undefined;
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | undefined>();
  const [isCloning, setIsCloning] = useState(false);
  const [stageDates, setStageDates] = useState<Record<StageDateField, string>>({
    startDate: '',
    receivedDate: '',
    completedDate: '',
  });
  const [showHiddenStages, setShowHiddenStages] = useState(false);
  const [showHiddenTasks, setShowHiddenTasks] = useState(false);
  const [taskTitleDrafts, setTaskTitleDrafts] = useState<Record<string, string>>({});
  const [memoDrafts, setMemoDrafts] = useState<Record<string, string>>({});
  const [editingMemoMap, setEditingMemoMap] = useState<Record<string, boolean>>({});
  const [memoExpandedMap, setMemoExpandedMap] = useState<Record<string, boolean>>({});
  const [addTaskModalStageId, setAddTaskModalStageId] = useState<string | null>(null);
  const [checklistExpandedMap, setChecklistExpandedMap] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type?: 'error' | 'info' | 'success' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const memoInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const taskCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasInitializedFromUrlRef = useRef(false);
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const projectQueryKey = useMemo(() => ['project', projectId], [projectId]);
  const activityQueryKey = useMemo(
    () => ['project', projectId, 'activity-log'],
    [projectId],
  );

  const resolveNextStatus = (status: TaskStatus): TaskStatus => {
    if (status === 'pending') return 'in_progress';
    if (status === 'in_progress') return 'completed';
    return 'pending';
  };

  const showToast = (
    message: string,
    type: 'error' | 'info' | 'success' = 'info',
    duration = 3000,
  ) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), duration);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const updateStageTasksInCache = (stageId: string, updater: (tasks: Task[]) => Task[]) => {
    queryClient.setQueryData<Project>(projectQueryKey, (prev) => {
      if (!prev) return prev;

      const updatedStages =
        prev.stages?.map((stage) =>
          stage.id === stageId
            ? {
                ...stage,
                tasks: updater(stage.tasks || []),
              }
            : stage,
        ) || [];

      return recalcProjectData(prev, updatedStages);
    });
  };

  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = useQuery<Project>({
    queryKey: projectQueryKey,
    queryFn: async () => {
      const res = await projectsApi.getOne(projectId, { includeInactive: true });
      return res.data;
    },
    enabled: hasProjectId,
    staleTime: 15 * 1000,
  });

  const projectWithDerived = useMemo(() => {
    if (!project) return null;

    return recalcProjectData(project, project.stages || []);
  }, [project]);

  useEffect(() => {
    if (!initialTaskId || !projectWithDerived?.stages) return;
    if (hasInitializedFromUrlRef.current) return;

    const stageWithTask = projectWithDerived.stages.find((stage) =>
      stage.tasks?.some((task) => task.id === initialTaskId),
    );

    if (stageWithTask) {
      setActiveStageId(stageWithTask.id);
      setHighlightedTaskId(initialTaskId);
      hasInitializedFromUrlRef.current = true;
    }
  }, [initialTaskId, projectWithDerived?.stages]);

  useEffect(() => {
    if (!projectWithDerived?.stages) return;

    setMemoDrafts((prev) => {
      const next = { ...prev };
      projectWithDerived.stages.forEach((stage) => {
        stage.tasks?.forEach((task) => {
          if (!editingMemoMap[task.id]) {
            next[task.id] = task.memo ?? '';
          }
        });
      });
      return next;
    });
  }, [projectWithDerived?.stages, editingMemoMap]);

  useEffect(() => {
    Object.entries(editingMemoMap).forEach(([taskId, isEditing]) => {
      if (isEditing) {
        memoInputRefs.current[taskId]?.focus();
      }
    });
  }, [editingMemoMap]);


  const visibleStages = useMemo(() => {
    if (!projectWithDerived?.stages) return [] as ProjectStage[];
    return projectWithDerived.stages.filter(
      (stage) => showHiddenStages || stage.isActive !== false,
    );
  }, [projectWithDerived?.stages, showHiddenStages]);

  const { data: activityLog } = useQuery<TaskHistory[]>({
    queryKey: activityQueryKey,
    queryFn: async () => {
      const res = await projectsApi.getActivityLog(projectId);
      return res.data;
    },
    enabled: hasProjectId,
    staleTime: 15 * 1000,
  });

  const { data: templateOptions } = useQuery<TemplateListItemDto[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await templatesApi.getAll();
      return res.data;
    },
    enabled: isAddStageModalOpen,
  });

  const { mutate: updateTaskStatus, isPending: isUpdatingTask } = useMutation({
    mutationFn: async ({ taskId, nextStatus }: { taskId: string; nextStatus: TaskStatus }) => {
      await tasksApi.updateStatus(taskId, nextStatus);
    },
    onMutate: async ({ taskId, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: projectQueryKey });
      const previousProject = queryClient.getQueryData<Project>(projectQueryKey);

      if (previousProject) {
        const updatedStages = previousProject.stages?.map((stage) => {
          const updatedTasks = stage.tasks?.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: nextStatus,
                }
              : task,
          );

          const derivedStatus = deriveStageStatus({ ...stage, tasks: updatedTasks || [] });

          return {
            ...stage,
            tasks: updatedTasks || [],
            status: derivedStatus,
          };
        });

        const stats = calculateTaskStats(updatedStages);

        queryClient.setQueryData<Project>(projectQueryKey, {
          ...previousProject,
          stages: updatedStages || [],
          totalTasks: stats.totalTasks,
          completedTasks: stats.completedTasks,
          progress: stats.progress,
        });
      }

      return { previousProject };
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(projectQueryKey, context.previousProject);
      }
      const message = error?.response?.data?.message || '태스크 상태 변경에 실패했습니다.';
      showToast(message, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey });
      queryClient.invalidateQueries({ queryKey: activityQueryKey });
    },
  });

  const { mutate: toggleStageActive, isPending: isTogglingStage } = useMutation({
    mutationFn: async ({ stageId, isActive }: { stageId: string; isActive: boolean }) => {
      await stagesApi.updateActive(stageId, isActive);
    },
    onMutate: async ({ stageId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: projectQueryKey });
      const previousProject = queryClient.getQueryData<Project>(projectQueryKey);

      if (previousProject) {
        const updatedStages =
          previousProject.stages?.map((stage) =>
            stage.id === stageId
              ? {
                  ...stage,
                  isActive,
                }
              : stage,
          ) || [];

        queryClient.setQueryData<Project>(projectQueryKey, recalcProjectData(previousProject, updatedStages));
      }

      return { previousProject };
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(projectQueryKey, context.previousProject);
      }
      const message = error?.response?.data?.message || '단계를 표시/숨김 처리하는 데 실패했습니다.';
      showToast(message, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey });
    },
  });

  const { mutate: updateTaskFields, isPending: isSavingTaskFields } = useMutation({
    mutationFn: async ({
      taskId,
      stageId,
      data,
    }: {
      taskId: string;
      stageId: string;
      data: Partial<Pick<Task, 'title' | 'isActive' | 'startDate' | 'completedDate' | 'dueDate' | 'memo'>>;
    }) => {
      const response = await tasksApi.update(taskId, data);
      return response.data;
    },
    onMutate: async ({ taskId, stageId, data }) => {
      await queryClient.cancelQueries({ queryKey: projectQueryKey });
      const previousProject = queryClient.getQueryData<Project>(projectQueryKey);

      updateStageTasksInCache(stageId, (tasks) =>
        tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...data,
              }
            : task,
        ),
      );

      return { previousProject };
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(projectQueryKey, context.previousProject);
      }
      const message = error?.response?.data?.message || '태스크를 수정하는 데 실패했습니다.';
      showToast(message, 'error');
    },
    onSuccess: (task, { stageId }) => {
      updateStageTasksInCache(stageId, (tasks) => tasks.map((t) => (t.id === task.id ? { ...task } : t)));
      setTaskTitleDrafts((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
      showToast('태스크가 저장되었습니다.', 'success');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey });
      queryClient.invalidateQueries({ queryKey: activityQueryKey });
    },
  });

  const { mutate: deleteTask, isPending: isDeletingTask } = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      await tasksApi.delete(taskId);
    },
    onMutate: async ({ taskId }) => {
      await queryClient.cancelQueries({ queryKey: projectQueryKey });
      const previousProject = queryClient.getQueryData<Project>(projectQueryKey);

      const stageId = previousProject?.stages?.find((stage) =>
        stage.tasks?.some((task) => task.id === taskId),
      )?.id;

      if (stageId) {
        updateStageTasksInCache(stageId, (tasks) => tasks.filter((task) => task.id !== taskId));
      }

      return { previousProject, stageId };
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(projectQueryKey, context.previousProject);
      }
      const message = error?.response?.data?.message || '태스크를 삭제하는 데 실패했습니다.';
      showToast(message, 'error');
    },
    onSuccess: (_data, vars, context) => {
      if (context?.stageId) {
        queryClient.invalidateQueries({ queryKey: projectQueryKey });
      }
      if (vars?.taskId) {
        setTaskTitleDrafts((prev) => {
          const next = { ...prev };
          delete next[vars.taskId];
          return next;
        });
      }
      showToast('태스크를 삭제했습니다.', 'success');
    },
  });

  const { mutate: saveStageDates, isPending: isSavingStageDates } = useMutation({
    mutationFn: async ({
      stageId,
      payload,
    }: {
      stageId: string;
      payload: Partial<Record<StageDateField, string | null>>;
    }) => {
      const response = await stagesApi.updateDates(stageId, payload);
      return response.data;
    },
    onSuccess: (updatedStage) => {
      queryClient.setQueryData<Project>(projectQueryKey, (prev) => {
        if (!prev) return prev;
        const updatedStages =
          prev.stages?.map((stage) =>
            stage.id === updatedStage.id
              ? {
                  ...stage,
                  ...updatedStage,
                }
              : stage,
          ) || [];

        return recalcProjectData(prev, updatedStages);
      });
    },
    onError: () => {
      showToast('단계 일정을 저장하는 중 오류가 발생했습니다.', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async () => {
      const response = await projectsApi.clone(projectId);
      return response.data;
    },
    onSuccess: (data) => {
      alert(`프로젝트가 복제되었습니다!\n새 프로젝트: ${data.name}`);
      router.push(`/projects/${data.id}`);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || '프로젝트 복제에 실패했습니다.');
    },
    onSettled: () => setIsCloning(false),
  });

  const {
    mutate: deleteProject,
    isPending: isDeletingProject,
  } = useMutation({
    mutationFn: async () => {
      await projectsApi.delete(projectId);
    },
    onSuccess: () => {
      showToast('프로젝트가 삭제(보관)되었습니다.', 'success');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/projects');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || '프로젝트 삭제(보관)에 실패했습니다.';
      showToast(message, 'error');
    },
  });

  const { mutate: addStageFromTemplate, isPending: isAddingStage } = useMutation({
    mutationFn: async ({ templateId, afterStageId }: { templateId: string; afterStageId?: string }) => {
      const response = await projectsApi.addStageFromTemplate(projectId, { templateId, afterStageId });
      return response.data as Project;
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<Project>(projectQueryKey, updatedProject);
      const previousStages = queryClient.getQueryData<Project>(projectQueryKey)?.stages || [];
      const newStage = updatedProject.stages?.find(
        (stage) => !previousStages.some((existing) => existing.id === stage.id),
      );
      const newStageId = newStage?.id || updatedProject.stages?.[updatedProject.stages.length - 1]?.id;

      if (newStageId) {
        setActiveStageId(newStageId);
      }

      setIsAddStageModalOpen(false);
      setSelectedTemplateId('');
      showToast('단계가 추가되었습니다.', 'success');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || '단계를 추가하지 못했습니다.';
      showToast(message, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey });
    },
  });

  useEffect(() => {
    if (visibleStages.length) {
      setActiveStageId((prev) => {
        if (prev && visibleStages.some((stage) => stage.id === prev)) {
          return prev;
        }
        return visibleStages[0].id;
      });
    } else {
      setActiveStageId(null);
    }
  }, [visibleStages]);

  const activeStage = useMemo(() => {
    return visibleStages.find((s) => s.id === activeStageId) || visibleStages[0];
  }, [activeStageId, visibleStages]);

  const activeStageTasks: Task[] = useMemo(() => {
    const tasks = activeStage?.tasks || [];
    return showHiddenTasks ? tasks : tasks.filter((task) => task.isActive !== false);
  }, [activeStage?.tasks, showHiddenTasks]);

  useEffect(() => {
    if (!highlightedTaskId) return;

    const target = taskCardRefs.current[highlightedTaskId];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedTaskId, activeStageTasks.length, activeStageId]);

  useEffect(() => {
    if (activeStage) {
      setStageDates({
        startDate: normalizeDateInput(activeStage.startDate),
        receivedDate: normalizeDateInput(activeStage.receivedDate),
        completedDate: normalizeDateInput(activeStage.completedDate),
      });
    } else {
      setStageDates({ startDate: '', receivedDate: '', completedDate: '' });
    }
  }, [activeStage]);

  useEffect(() => {
    setTaskTitleDrafts({});
  }, [activeStageId]);

  useEffect(() => {
    setChecklistExpandedMap({});
  }, [activeStageId]);

  useEffect(() => {
    if (isAddStageModalOpen && templateOptions?.length && !selectedTemplateId) {
      setSelectedTemplateId(templateOptions[0].id);
    }
  }, [isAddStageModalOpen, templateOptions, selectedTemplateId]);

  const activeStageTaskCounts = useMemo(() => {
    const tasks = activeStage?.tasks || [];
    const list = showHiddenTasks ? tasks : tasks.filter((task) => task.isActive !== false);
    return {
      total: list.length,
      completed: list.filter((task) => task.status === 'completed').length,
    };
  }, [activeStage?.tasks, showHiddenTasks]);

  const handleStageClick = (stageId: string) => {
    setActiveStageId(stageId);
  };

  const handleStageActiveToggle = (stageId: string, currentActive?: boolean) => {
    toggleStageActive({ stageId, isActive: !(currentActive !== false) });
  };

  const handleTaskActiveToggle = (task: Task) => {
    if (!task?.id || !activeStage?.id) return;
    updateTaskFields({ taskId: task.id, stageId: activeStage.id, data: { isActive: !(task.isActive !== false) } });
  };

  const handleTaskDateChange = (
    task: Task,
    field: 'startDate' | 'completedDate' | 'dueDate',
    value: string,
  ) => {
    if (!task?.id || !activeStage?.id) return;

    updateTaskFields({
      taskId: task.id,
      stageId: activeStage.id,
      data: {
        [field]: value ? new Date(value).toISOString() : null,
      },
    });
  };

  const handleTaskTitleChange = (taskId: string, value: string) => {
    setTaskTitleDrafts((prev) => ({ ...prev, [taskId]: value }));
  };

  const handleTaskTitleBlur = (task: Task) => {
    if (!task?.id || !activeStage?.id) return;
    const draft = taskTitleDrafts[task.id];
    const nextTitle = draft ?? task.title;

    if (!nextTitle || nextTitle.trim() === '' || nextTitle === task.title || task.id.startsWith('temp-')) return;

    updateTaskFields({ taskId: task.id, stageId: activeStage.id, data: { title: nextTitle.trim() } });
  };

  const startEditingMemo = (taskId: string) => {
    setEditingMemoMap((prev) => ({ ...prev, [taskId]: true }));
  };

  const stopEditingMemo = (taskId: string) => {
    setEditingMemoMap((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const toggleMemoExpanded = (taskId: string) => {
    setMemoExpandedMap((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const resetMemoExpanded = (taskId: string) => {
    setMemoExpandedMap((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const handleMemoDraftChange = (taskId: string, value: string) => {
    setMemoDrafts((prev) => ({ ...prev, [taskId]: value }));
  };

  const handleMemoSave = (task: Task) => {
    if (!task?.id || !activeStage?.id) {
      stopEditingMemo(task.id);
      return;
    }

    const draft = memoDrafts[task.id] ?? '';
    const original = task.memo ?? '';

    if (draft.trim() === original.trim()) {
      stopEditingMemo(task.id);
      resetMemoExpanded(task.id);
      return;
    }

    updateTaskFields(
      { taskId: task.id, stageId: activeStage.id, data: { memo: draft } },
      {
        onSuccess: () => {
          stopEditingMemo(task.id);
          resetMemoExpanded(task.id);
        },
        onError: () => {
          stopEditingMemo(task.id);
          resetMemoExpanded(task.id);
        },
      },
    );
  };

  const toggleChecklistPanel = (taskId: string) => {
    setChecklistExpandedMap((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleCompletionToggle = (task: Task, checked: boolean) => {
    if (!task?.id || isUpdatingTask || task.isActive === false) return;
    const nextStatus: TaskStatus = checked ? 'completed' : 'pending';
    updateTaskStatus({ taskId: task.id, nextStatus });
  };

  const handleStatusToggle = (task: Task) => {
    if (!task?.id || isUpdatingTask || task.isActive === false) return;
    const nextStatus = resolveNextStatus(task.status);
    updateTaskStatus({ taskId: task.id, nextStatus });
  };

  const handleAddTask = () => {
    if (!activeStage?.id) return;
    setAddTaskModalStageId(activeStage.id);
  };

  const handleDeleteTask = (task: Task) => {
    if (!task?.id || isDeletingTask) return;
    deleteTask({ taskId: task.id });
  };

  const handleCloneProject = async () => {
    if (!projectId || isCloning) return;
    setIsCloning(true);
    const confirmed = window.confirm(
      `"${projectWithDerived?.name || '프로젝트'}" 프로젝트를 복제하시겠습니까?\n\n` +
        `- 단계와 태스크 구조가 복제됩니다.\n` +
        `- 문서와 사진은 복제되지 않습니다.\n` +
        `- 마감일은 초기화됩니다.`,
    );

    if (!confirmed) {
      setIsCloning(false);
      return;
    }

    cloneMutation.mutate();
  };

  const handleDateChange = (field: StageDateField, value: string) => {
    setStageDates((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDates = () => {
    if (!activeStage?.id) return;

    saveStageDates({
      stageId: activeStage.id,
      payload: {
        startDate: stageDates.startDate || null,
        receivedDate: stageDates.receivedDate || null,
        completedDate: stageDates.completedDate || null,
      },
    });
  };

  const isLoading = isProjectLoading && !projectWithDerived;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        프로젝트 정보를 불러오는 중입니다...
      </div>
    );
  }

  if (!hasProjectId || isProjectError || !projectWithDerived) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <p className="text-slate-700">프로젝트를 불러오는 중 오류가 발생했습니다.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" /> 대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{projectWithDerived.name}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                  {projectWithDerived.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {projectWithDerived.address}
                    </span>
                  )}
                  {projectWithDerived.capacityKw && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-yellow-500" />
                      {projectWithDerived.capacityKw} kW
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 진행률 */}
              <div className="text-right hidden sm:block">
                <div className="text-sm text-slate-600">진행률</div>
                <div className="font-bold text-slate-900">
                  {projectWithDerived.progress ?? 0}%
                </div>
              </div>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                <div
                  className={cn(
                    'h-full rounded-full',
                    getProgressColor(projectWithDerived.progress ?? 0),
                  )}
                  style={{ width: `${projectWithDerived.progress ?? 0}%` }}
                />
              </div>
              {/* 공유 버튼 */}
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">공유</span>
              </button>
              {/* [v1.1] 복제 버튼 */}
              <button
                onClick={handleCloneProject}
                disabled={isCloning || cloneMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCloning || cloneMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isCloning || cloneMutation.isPending ? '복제 중...' : '복제'}
                </span>
              </button>
              {/* 삭제/보관 버튼 */}
              <button
                type="button"
                onClick={() => {
                  if (!projectId || isDeletingProject) return;
                  const confirmed = window.confirm(
                    `${projectWithDerived.name} 프로젝트를 삭제(보관)하시겠습니까?\n\n` +
                      '- 데이터는 완전히 제거되지 않고 복구 가능한 상태로 보관됩니다.\n' +
                      '- 대시보드와 프로젝트 목록에서 더 이상 표시되지 않습니다.',
                  );

                  if (!confirmed) return;
                  deleteProject();
                }}
                disabled={isDeletingProject}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span className="hidden sm:inline">삭제/보관</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 좌측: 단계 탭 */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-28">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">프로젝트 단계</h3>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="whitespace-nowrap">숨김 단계 보기</span>
                  <button
                    type="button"
                    onClick={() => setShowHiddenStages((prev) => !prev)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      showHiddenStages ? 'bg-blue-600' : 'bg-slate-200',
                    )}
                    aria-pressed={showHiddenStages}
                    aria-label="숨김 단계 보기 토글"
                  >
                    <span
                      className={cn(
                        'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                        showHiddenStages ? 'translate-x-5' : 'translate-x-1',
                      )}
                  />
                </button>
              </label>
              <button
                type="button"
                onClick={() => setIsAddStageModalOpen(true)}
                className="mt-3 inline-flex items-center gap-2 w-full justify-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100"
              >
                <Plus className="h-4 w-4" />
                <span>단계 추가</span>
              </button>
            </div>
            <nav className="space-y-1">
              {visibleStages.map((stage) => {
                  const isActive = stage.id === activeStageId;
                  const stageIsVisible = stage.isActive !== false;
                  const activeStageTasks = (stage.tasks || []).filter((t) => t.isActive !== false);
                  const completedTasks = activeStageTasks.filter((t) => t.status === 'completed').length;
                  const totalTasks = activeStageTasks.length;
                  const statusForIcon = (stage as DerivedStage).derivedStatus || stage.status;

                  return (
                    <div key={stage.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStageClick(stage.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors flex-1',
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-50',
                          !stageIsVisible && showHiddenStages && 'opacity-60',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {statusForIcon === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : statusForIcon === 'active' ? (
                            <Clock className="h-4 w-4 text-blue-500" />
                          ) : statusForIcon === 'inactive' ? (
                            <EyeOff className="h-4 w-4 text-slate-400" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300" />
                          )}
                          <span className="text-sm font-medium">
                            {stage.template?.name || '단계'}
                          </span>
                          {!stageIsVisible && showHiddenStages && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-full">
                              숨김
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {completedTasks}/{totalTasks}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStageActiveToggle(stage.id, stage.isActive)}
                        disabled={isTogglingStage}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                        aria-label={`단계 ${stage.template?.name || ''} ${stageIsVisible ? '숨기기' : '표시하기'}`}
                      >
                        {stageIsVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* 중앙: 태스크 테이블 */}
          <div className="flex-1 min-w-0">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {activeStage?.template?.name || '태스크 목록'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      전체 {activeStageTaskCounts.total}개 · 완료 {activeStageTaskCounts.completed}개
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="hidden sm:inline">숨김 태스크 보기</span>
                    <button
                      type="button"
                      onClick={() => setShowHiddenTasks((prev) => !prev)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        showHiddenTasks ? 'bg-blue-600' : 'bg-slate-200',
                      )}
                      aria-pressed={showHiddenTasks}
                      aria-label="숨김 태스크 보기 토글"
                    >
                      <span
                        className={cn(
                          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                          showHiddenTasks ? 'translate-x-5' : 'translate-x-1',
                        )}
                      />
                    </button>
                  </label>
                </div>

              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <div className="grid gap-4 sm:grid-cols-3">
                  {(['startDate', 'receivedDate', 'completedDate'] as StageDateField[]).map((field) => (
                    <label key={field} className="flex flex-col gap-2 text-sm text-slate-700">
                      <span>
                        {field === 'startDate'
                          ? '시작일'
                          : field === 'receivedDate'
                          ? '접수일'
                          : '완료일'}
                      </span>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={stageDates[field]}
                        onChange={(e) => handleDateChange(field, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={handleSaveDates}
                    disabled={isSavingStageDates}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingStageDates ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {activeStageTasks.length ? (
                  activeStageTasks.map((task, index) => {
                    const statusConfig = STATUS_LABELS[task.status];
                    const isTaskActive = task.isActive !== false;
                    const titleValue = taskTitleDrafts[task.id] ?? task.title;
                    const isEditingMemo = editingMemoMap[task.id] === true;
                    const memoDraft = memoDrafts[task.id] ?? task.memo ?? '';
                    const isMemoExpanded = memoExpandedMap[task.id] === true;
                    const memoIsLong = isLongMemo(task.memo);
                    const isHighlighted = highlightedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        ref={(el) => {
                          taskCardRefs.current[task.id] = el;
                        }}
                        className={cn(
                          'flex flex-col gap-3 px-5 py-4 hover:bg-slate-50 transition-colors rounded-lg border border-transparent',
                          !isTaskActive && showHiddenTasks && 'opacity-60',
                          isHighlighted && 'border-indigo-400 bg-indigo-50/70 shadow-sm',
                        )}
                      >
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={task.status === 'completed'}
                                  onChange={(e) => handleCompletionToggle(task, e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  disabled={isUpdatingTask || !isTaskActive || isSavingTaskFields}
                                />
                                <span>완료</span>
                              </label>

                              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={isTaskActive}
                                  onChange={() => handleTaskActiveToggle(task)}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  disabled={isSavingTaskFields}
                                />
                                <span>활성</span>
                              </label>

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{`#${index + 1}`}</span>
                                  {task.isMandatory && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">필수</span>
                                  )}
                                  {statusConfig && (
                                    <span className={cn('px-2 py-0.5 rounded-full font-medium', statusConfig.color)}>
                                      {statusConfig.label}
                                    </span>
                                  )}
                                  {task.checklistSummary && task.checklistSummary.total > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                      📋 {task.checklistSummary.completed}/{task.checklistSummary.total}
                                    </span>
                                  )}
                                  {!isTaskActive && showHiddenTasks && (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">숨김</span>
                                  )}
                                </div>

                                <input
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  value={titleValue}
                                  onChange={(e) => handleTaskTitleChange(task.id, e.target.value)}
                                  onBlur={() => handleTaskTitleBlur(task)}
                                  placeholder="태스크 이름"
                                  disabled={isSavingTaskFields}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start">
                              <button
                                type="button"
                                disabled={isUpdatingTask || !isTaskActive || isSavingTaskFields}
                                onClick={() => handleStatusToggle(task)}
                                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
                              >
                                {task.status === 'completed' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : task.status === 'in_progress' ? (
                                  <Clock className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-slate-400" />
                                )}
                                <span>상태</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleChecklistPanel(task.id)}
                                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                              >
                                <span role="img" aria-label="checklist">
                                  📋
                                </span>
                                <span>체크리스트</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task)}
                                disabled={isDeletingTask || isSavingTaskFields}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                aria-label={`${task.title} 삭제`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <label className="flex items-center gap-2">
                              <span>기한</span>
                              <input
                                type="date"
                                value={normalizeDateInput(task.dueDate)}
                                onChange={(e) => handleTaskDateChange(task, 'dueDate', e.target.value)}
                                className="rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </label>
                            <label className="flex items-center gap-2">
                              <span>시작일</span>
                              <input
                                type="date"
                                value={normalizeDateInput(task.startDate)}
                                onChange={(e) => handleTaskDateChange(task, 'startDate', e.target.value)}
                                className="rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </label>
                            <label className="flex items-center gap-2">
                              <span>완료일</span>
                              <input
                                type="date"
                                value={normalizeDateInput(task.completedDate)}
                                onChange={(e) => handleTaskDateChange(task, 'completedDate', e.target.value)}
                                className="rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </label>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-500">메모</label>
                            {!isEditingMemo ? (
                              <div className="space-y-1">
                                <div
                                  className={cn(
                                    'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white/70 cursor-text whitespace-pre-line',
                                    memoIsLong && !isMemoExpanded ? 'line-clamp-3' : '',
                                    !task.memo || task.memo.trim().length === 0 ? 'text-slate-400' : '',
                                  )}
                                  onClick={() => {
                                    startEditingMemo(task.id);
                                    handleMemoDraftChange(task.id, task.memo ?? '');
                                  }}
                                >
                                  {task.memo && task.memo.trim().length > 0
                                    ? task.memo
                                    : '메모를 입력해 주세요.'}
                                </div>
                                {memoIsLong && (
                                  <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:underline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMemoExpanded(task.id);
                                    }}
                                  >
                                    {isMemoExpanded ? '간략히' : '자세히'}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <textarea
                                ref={(el) => {
                                  memoInputRefs.current[task.id] = el;
                                }}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                value={memoDraft}
                                rows={3}
                                onChange={(e) => handleMemoDraftChange(task.id, e.target.value)}
                                onBlur={() => handleMemoSave(task)}
                                onKeyDown={(e) => {
                                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                  }
                                }}
                                placeholder="메모를 입력해 주세요."
                                disabled={isSavingTaskFields}
                              />
                            )}
                          </div>

                          {checklistExpandedMap[task.id] && (
                            <div className="pt-2">
                              <ChecklistPanel taskId={task.id} defaultExpanded />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-5 py-8 text-center text-slate-500">
                    선 택된 단계에 태스크가 없습니다.
                  </div>
                )}
              </div>
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddTask}
                  disabled={!activeStage?.id}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  <span>태스크 추가</span>
                </button>
              </div>
            </div>
          </div>

          {/* 우측: 활동 로그 */}
          <div className="w-80 flex-shrink-0 hidden xl:block">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-28">
              <h3 className="font-semibold text-slate-900 mb-4">최근 활동</h3>
              <div className="space-y-4">
                {activityLog?.length ? (
                  activityLog.map((log) => {
                    const userName = log.user?.name || '알 수 없음';
                    const taskTitle = log.task?.title || '작업';
                    const userInitial = userName.charAt(0).toUpperCase();
                    const createdLabel = log.createdAt
                      ? formatRelativeTime(log.createdAt)
                      : '방금 전';

                    return (
                      <div key={log.id} className="flex gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-slate-600">
                            {userInitial}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900">
                            <span className="font-medium">{userName}</span>
                            <span className="text-slate-500">님이 </span>
                            <span className="font-medium">{taskTitle}</span>
                          </p>
                          {log.comment && (
                            <p className="text-sm text-slate-600 mt-0.5">
                              {log.comment}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {createdLabel}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">활동 로그가 없습니다.</p>
                )}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                전체 활동 보기
              </button>
            </div>
          </div>
        </div>
      </main>

      {addTaskModalStageId && projectId && (
        <AddTaskModal
          stageId={addTaskModalStageId}
          projectId={projectId}
          isOpen={Boolean(addTaskModalStageId)}
          onClose={() => setAddTaskModalStageId(null)}
        />
      )}
      {isAddStageModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">템플릿에서 단계 추가</h3>
              <p className="text-sm text-slate-600">추가할 템플릿을 선택하면 해당 단계와 태스크가 프로젝트에 복사됩니다.</p>
            </div>
            <label className="block text-sm text-slate-700 space-y-2">
              <span>템플릿 선택</span>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                {(templateOptions || []).map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddStageModalOpen(false);
                  setSelectedTemplateId('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!selectedTemplateId || isAddingStage}
                onClick={() => selectedTemplateId && addStageFromTemplate({ templateId: selectedTemplateId })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isAddingStage ? '추가 중...' : '단계 추가'}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div
          role="alert"
          className={cn(
            'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm z-50',
            toast.type === 'error'
              ? 'bg-red-500 text-white'
              : toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-slate-800 text-white',
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
