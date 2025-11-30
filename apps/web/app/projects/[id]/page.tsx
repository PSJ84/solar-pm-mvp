'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  MapPin,
  Zap,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  ChevronRight,
  Copy,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, STATUS_LABELS, formatRelativeTime, getProgressColor } from '@/lib/utils';
import { projectsApi, stagesApi, tasksApi } from '@/lib/api';
import type { Project, ProjectStage, Task, TaskHistory, TaskStatus } from '@/types';

type DerivedStage = ProjectStage & { derivedStatus: string };

type StageDateField = 'startDate' | 'receivedDate' | 'completedDate';

const deriveStageStatus = (stage: ProjectStage): string => {
  const tasks = stage.tasks || [];

  if (tasks.length > 0) {
    const completedCount = tasks.filter((t) => t.status === 'completed').length;
    const hasInProgress = tasks.some((t) => t.status === 'in_progress');

    if (completedCount === tasks.length) return 'completed';
    if (hasInProgress || completedCount > 0) return 'active';
    return 'pending';
  }

  return stage.status;
};

const calculateTaskStats = (stages?: ProjectStage[] | DerivedStage[]) => {
  const allTasks = stages?.flatMap((s) => s.tasks || []) || [];
  const completedTasks = allTasks.filter((task) => task.status === 'completed');
  const totalTasks = allTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  return { totalTasks, completedTasks: completedTasks.length, progress };
};

const normalizeDateInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const idValue = params?.id;
  const projectId = Array.isArray(idValue) ? idValue[0] : idValue ? String(idValue) : '';
  const hasProjectId = Boolean(projectId);

  const queryClient = useQueryClient();
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [stageDates, setStageDates] = useState<Record<StageDateField, string>>({
    startDate: '',
    receivedDate: '',
    completedDate: '',
  });

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

  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = useQuery<Project>({
    queryKey: projectQueryKey,
    queryFn: async () => {
      const res = await projectsApi.getOne(projectId);
      return res.data;
    },
    enabled: hasProjectId,
    staleTime: 15 * 1000,
  });

  const projectWithDerived = useMemo(() => {
    if (!project) return null;

    const stagesWithDerived: DerivedStage[] = (project.stages || []).map((stage) => ({
      ...stage,
      derivedStatus: deriveStageStatus(stage),
    }));

    const stats = calculateTaskStats(stagesWithDerived);

    return {
      ...project,
      stages: stagesWithDerived,
      totalTasks: project.totalTasks ?? stats.totalTasks,
      completedTasks: project.completedTasks ?? stats.completedTasks,
      progress: project.progress ?? stats.progress,
    };
  }, [project]);

  const { data: activityLog } = useQuery<TaskHistory[]>({
    queryKey: activityQueryKey,
    queryFn: async () => {
      const res = await projectsApi.getActivityLog(projectId);
      return res.data;
    },
    enabled: hasProjectId,
    staleTime: 15 * 1000,
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
      // eslint-disable-next-line no-alert
      alert(message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey });
      queryClient.invalidateQueries({ queryKey: activityQueryKey });
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
        return {
          ...prev,
          stages:
            prev.stages?.map((stage) =>
              stage.id === updatedStage.id
                ? {
                    ...stage,
                    ...updatedStage,
                  }
                : stage,
            ) || [],
        };
      });
    },
    onError: () => {
      alert('단계 일정을 저장하는 중 오류가 발생했습니다.');
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

  useEffect(() => {
    if (projectWithDerived?.stages?.length) {
      setActiveStageId((prev) => {
        if (prev && projectWithDerived.stages.some((stage) => stage.id === prev)) {
          return prev;
        }
        return projectWithDerived.stages[0].id;
      });
    }
  }, [projectWithDerived?.stages]);

  const activeStage = useMemo(() => {
    return projectWithDerived?.stages?.find((s) => s.id === activeStageId) ||
      projectWithDerived?.stages?.[0];
  }, [activeStageId, projectWithDerived?.stages]);

  const activeTasks: Task[] = useMemo(
    () => activeStage?.tasks || [],
    [activeStage?.tasks],
  );

  useEffect(() => {
    if (activeStage) {
      setStageDates({
        startDate: normalizeDateInput(activeStage.startDate),
        receivedDate: normalizeDateInput(activeStage.receivedDate),
        completedDate: normalizeDateInput(activeStage.completedDate),
      });
    }
  }, [activeStage]);

  const taskCounts = useMemo(() => {
    const stats = calculateTaskStats(projectWithDerived?.stages);
    return {
      total: projectWithDerived?.totalTasks ?? stats.totalTasks,
      completed: projectWithDerived?.completedTasks ?? stats.completedTasks,
    };
  }, [projectWithDerived]);

  const handleStageClick = (stageId: string) => {
    setActiveStageId(stageId);
  };

  const handleStatusToggle = (task: Task) => {
    if (!task?.id || isUpdatingTask) return;
    const nextStatus = resolveNextStatus(task.status);
    updateTaskStatus({ taskId: task.id, nextStatus });
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
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 좌측: 단계 탭 */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-28">
              <h3 className="font-semibold text-slate-900 mb-3">프로젝트 단계</h3>
              <nav className="space-y-1">
                {projectWithDerived.stages?.map((stage) => {
                  const isActive = stage.id === activeStageId;
                  const completedTasks = (stage.tasks || []).filter(
                    (t) => t.status === 'completed',
                  ).length;
                  const statusForIcon = (stage as DerivedStage).derivedStatus || stage.status;

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => handleStageClick(stage.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {statusForIcon === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : statusForIcon === 'active' ? (
                          <Clock className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300" />
                        )}
                        <span className="text-sm font-medium">
                          {stage.template?.name || '단계'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {completedTasks}/{stage.tasks?.length || 0}
                      </span>
                    </button>
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
                    전체 {taskCounts.total}개 · 완료 {taskCounts.completed}개
                  </p>
                </div>
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
                {activeTasks.length ? (
                  activeTasks.map((task) => {
                    const statusConfig = STATUS_LABELS[task.status];

                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                      >
                        {/* 상태 체크박스/아이콘 */}
                        <button
                          type="button"
                          disabled={isUpdatingTask}
                          onClick={() => handleStatusToggle(task)}
                          className="flex-shrink-0 disabled:opacity-60"
                          aria-label="태스크 상태 변경"
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : task.status === 'in_progress' ? (
                            <Clock className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-300" />
                          )}
                        </button>

                        {/* 태스크 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'font-medium',
                                task.status === 'completed'
                                  ? 'text-slate-500 line-through'
                                  : 'text-slate-900',
                              )}
                            >
                              {task.title}
                            </span>
                            {task.isMandatory && (
                              <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                필수
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(task.dueDate).toLocaleDateString('ko-KR')}
                              </span>
                            )}
                            {task.assignee?.name && (
                              <span>담당: {task.assignee.name}</span>
                            )}
                          </div>
                        </div>

                        {/* 첨부 아이콘 */}
                        <div className="flex items-center gap-2 text-slate-400">
                          <button className="p-1.5 hover:bg-slate-100 rounded">
                            <ImageIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 hover:bg-slate-100 rounded">
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>

                        {/* 상태 배지 */}
                        {statusConfig && (
                          <span
                            className={cn(
                              'px-2.5 py-1 text-xs font-medium rounded-full',
                              statusConfig.color,
                            )}
                          >
                            {statusConfig.label}
                          </span>
                        )}

                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    );
                  })
                ) : (
                  <div className="px-5 py-8 text-center text-slate-500">
                    선 택된 단계에 태스크가 없습니다.
                  </div>
                )}
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
    </div>
  );
}
