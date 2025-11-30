// apps/web/app/projects/[id]/page.tsx
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
import { projectsApi, tasksApi } from '@/lib/api';
import type { Project, TaskHistory, TaskStatus } from '@/types';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const id = params?.id ?? '';
  const queryClient = useQueryClient();
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  const resolveNextStatus = (status: TaskStatus): TaskStatus => {
    if (status === 'pending') return 'in_progress';
    if (status === 'in_progress') return 'completed';
    return 'pending';
  };

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await projectsApi.getOne(id);
      return res.data;
    },
    enabled: Boolean(id),
    staleTime: 15 * 1000,
  });

  const { data: activityLog } = useQuery<TaskHistory[]>({
    queryKey: ['project', id, 'activity-log'],
    queryFn: async () => {
      const res = await projectsApi.getActivityLog(id);
      return res.data;
    },
    enabled: Boolean(project && id),
    staleTime: 15 * 1000,
  });

  const { mutateAsync: updateTaskStatus, isPending: isUpdatingTask } = useMutation({
    mutationFn: async ({ taskId, nextStatus }: { taskId: string; nextStatus: TaskStatus }) => {
      await tasksApi.updateStatus(taskId, nextStatus);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project', id] }),
        queryClient.invalidateQueries({ queryKey: ['project', id, 'activity-log'] }),
      ]);
    },
  });

  useEffect(() => {
    if (project?.stages?.length && !activeStage) {
      setActiveStage(project.stages[0].id);
    }
  }, [project, activeStage]);

  const activeStageData = useMemo(
    () => project?.stages?.find((s) => s.id === activeStage),
    [activeStage, project?.stages],
  );

  const handleCloneProject = async () => {
    if (!project || !id || isCloning) return;

    const confirmed = window.confirm(
      `"${project.name}" 프로젝트를 복제하시겠습니까?\n\n` +
        `- 단계와 태스크 구조가 복제됩니다.\n` +
        `- 문서와 사진은 복제되지 않습니다.\n` +
        `- 마감일은 초기화됩니다.`,
    );

    if (!confirmed) return;

    setIsCloning(true);
    try {
      const response = await projectsApi.clone(id);
      alert(`프로젝트가 복제되었습니다!\n새 프로젝트: ${response.data.name}`);
      router.push(`/projects/${response.data.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || '프로젝트 복제에 실패했습니다.');
    } finally {
      setIsCloning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        프로젝트 정보를 불러오는 중입니다...
      </div>
    );
  }

  if (isError || !project) {
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

  const taskCounts = {
    total: project.totalTasks || project.stages?.flatMap((s) => s.tasks || []).length || 0,
    completed:
      project.completedTasks ||
      project.stages?.flatMap((s) => s.tasks || []).filter((t) => t.status === 'completed').length ||
        0,
  };

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
                <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                  {project.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {project.address}
                    </span>
                  )}
                  {project.capacityKw && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-yellow-500" />
                      {project.capacityKw} kW
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 진행률 */}
              <div className="text-right hidden sm:block">
                <div className="text-sm text-slate-600">진행률</div>
                <div className="font-bold text-slate-900">{project.progress}%</div>
              </div>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                <div
                  className={cn('h-full rounded-full', getProgressColor(project.progress))}
                  style={{ width: `${project.progress}%` }}
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
                disabled={isCloning}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCloning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{isCloning ? '복제 중...' : '복제'}</span>
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
                {project.stages?.map((stage) => {
                  const isActive = stage.id === activeStage;
                  const completedTasks = (stage.tasks || []).filter((t) => t.status === 'completed').length;

                  return (
                    <button
                      key={stage.id}
                      onClick={() => setActiveStage(stage.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors',
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {stage.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : stage.status === 'active' ? (
                          <Clock className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300" />
                        )}
                        <span className="text-sm font-medium">{stage.template?.name}</span>
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
                    {activeStageData?.template?.name || '태스크 목록'}
                  </h3>
                  <p className="text-sm text-slate-500">전체 {taskCounts.total}개 · 완료 {taskCounts.completed}개</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {activeStageData?.tasks?.length ? (
                  activeStageData.tasks.map((task) => {
                    const statusConfig = STATUS_LABELS[task.status];

                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                      >
                        {/* 상태 체크박스/아이콘 */}
                        <button
                          disabled={isUpdatingTask}
                          onClick={() =>
                            updateTaskStatus({ taskId: task.id, nextStatus: resolveNextStatus(task.status) })
                          }
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
                              <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">필수</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(task.dueDate).toLocaleDateString('ko-KR')}
                              </span>
                            )}
                            {task.assignee?.name && <span>담당: {task.assignee.name}</span>}
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
                    선택된 단계에 태스크가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 우측: 활동 로그 (MVP #30) */}
          <div className="w-80 flex-shrink-0 hidden xl:block">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-28">
              <h3 className="font-semibold text-slate-900 mb-4">최근 활동</h3>
              <div className="space-y-4">
                {activityLog?.length ? (
                  activityLog.map((log) => {
                    const userName = log.user?.name || '알 수 없음';
                    const taskTitle = log.task?.title || '작업';
                    const userInitial = userName.charAt(0).toUpperCase();

                    return (
                      <div key={log.id} className="flex gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-slate-600">{userInitial}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900">
                            <span className="font-medium">{userName}</span>
                            <span className="text-slate-500">님이 </span>
                            <span className="font-medium">{taskTitle}</span>
                          </p>
                          {log.comment && (
                            <p className="text-sm text-slate-600 mt-0.5">{log.comment}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {formatRelativeTime(log.createdAt)}
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
