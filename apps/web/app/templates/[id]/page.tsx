// apps/web/app/templates/[id]/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  ChevronLeft,
  CircleDot,
  ListChecks,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';

import { AppShell } from '@/components/layout/AppShell';
import { TaskTemplateChecklistModal } from '@/components/templates/TaskTemplateChecklistModal';
import { templatesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

// NOTE: shared 타입은 monorepo의 packages/shared 에 있음
import type {
  TemplateDetailDto,
  StageTemplateStageDto,
  StageTemplateTaskDto,
  ProjectStageTemplateDto,
} from '../../../../../packages/shared/src/types/template.types';

type ToastState = {
  message: string;
  type?: 'error' | 'info' | 'success';
};

const Badge = ({
  label,
  tone = 'slate',
}: {
  label: string;
  tone?: 'slate' | 'blue' | 'amber' | 'emerald';
}) => {
  const toneStyles: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700 border border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${toneStyles[tone] || toneStyles.slate}`}>
      {label}
    </span>
  );
};

export default function TemplateDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const idValue = params?.id;
  const templateId = Array.isArray(idValue) ? idValue[0] : idValue ? String(idValue) : '';
  const hasTemplateId = Boolean(templateId);

  const queryClient = useQueryClient();

  const [templateName, setTemplateName] = useState<string>('');
  const [templateDescription, setTemplateDescription] = useState<string>('');
  const [stages, setStages] = useState<StageTemplateStageDto[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [checklistModalState, setChecklistModalState] = useState<{
    isOpen: boolean;
    taskTemplateId: string;
    taskTemplateName: string;
    checklistTemplateId: string | null;
    checklistTemplateName: string | null;
  }>({
    isOpen: false,
    taskTemplateId: '',
    taskTemplateName: '',
    checklistTemplateId: null,
    checklistTemplateName: null,
  });
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const openChecklistModal = (task: StageTemplateTaskDto) => {
    setChecklistModalState({
      isOpen: true,
      taskTemplateId: task.id || '',
      taskTemplateName: task.name,
      checklistTemplateId: task.checklistTemplateId || null,
      checklistTemplateName: task.checklistTemplateName || null,
    });
  };

  const closeChecklistModal = () => {
    setChecklistModalState((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<TemplateDetailDto>({
    queryKey: ['template', templateId],
    queryFn: async () => {
      const res = await templatesApi.getOne(templateId);
      return res.data;
    },
    enabled: hasTemplateId,
  });

  // API 데이터 들어오면 로컬 상태 세팅
  useEffect(() => {
    if (data) {
      setTemplateName(data.name || '');
      setTemplateDescription(data.description || '');
      setStages(
        data.stages.map((stage) => ({
          ...stage,
          tasks: stage.tasks ? [...stage.tasks] : [],
        })),
      );
    }
  }, [data]);

  const moveTask = (stageIndex: number, taskIndex: number, direction: 'up' | 'down') => {
    setStages((prev) =>
      prev.map((stage, sIdx) => {
        if (sIdx !== stageIndex) return stage;

        const newTasks = [...stage.tasks];
        const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;

        if (targetIndex < 0 || targetIndex >= newTasks.length) return stage;

        const [task] = newTasks.splice(taskIndex, 1);
        newTasks.splice(targetIndex, 0, task);

        return {
          ...stage,
          tasks: newTasks.map((taskItem, idx) => ({ ...taskItem, order: idx })),
        };
      }),
    );
  };

  const updateTaskField = (
    stageIndex: number,
    taskIndex: number,
    field: keyof StageTemplateTaskDto,
    value: string | boolean,
  ) => {
    setStages((prev) =>
      prev.map((stage, sIdx) => {
        if (sIdx !== stageIndex) return stage;

        const tasks = stage.tasks.map((task, tIdx) =>
          tIdx === taskIndex ? { ...task, [field]: value } : task,
        );

        return { ...stage, tasks };
      }),
    );
  };

  const addTask = (stageIndex: number) => {
    setStages((prev) =>
      prev.map((stage, sIdx) => {
        if (sIdx !== stageIndex) return stage;

        const newTask: StageTemplateTaskDto = {
          id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: '새 태스크',
          isMandatory: false,
          isDefaultActive: true,
          order: stage.tasks.length,
        };

        return { ...stage, tasks: [...stage.tasks, newTask] };
      }),
    );
  };

  const removeTask = (stageIndex: number, taskIndex: number) => {
    setStages((prev) =>
      prev.map((stage, sIdx) => {
        if (sIdx !== stageIndex) return stage;

        const newTasks = stage.tasks
          .filter((_, idx) => idx !== taskIndex)
          .map((task, idx) => ({ ...task, order: idx }));

        return { ...stage, tasks: newTasks };
      }),
    );
  };

  // 서버로 보낼 때는 stage / task 순서를 인덱스로 재정규화
  const normalizedStages: StageTemplateStageDto[] = useMemo(
    () =>
      stages.map((stage, stageIndex) => ({
        ...stage,
        order: stageIndex,
        tasks: stage.tasks.map((task, taskIndex) => ({
          ...task,
          order: taskIndex,
        })),
      })),
    [stages],
  );

  const { mutate: saveTemplate, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!templateName.trim()) {
        throw new Error('템플릿 이름을 입력해주세요.');
      }

      const payload: ProjectStageTemplateDto = {
        id: templateId,
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        isDefault: data?.isDefault ?? false,
        stages: normalizedStages,
      };

      const res = await templatesApi.updateStructure(templateId, payload);
      return res.data as TemplateDetailDto;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['template', templateId], updated);
      setTemplateName(updated.name || '');
      setTemplateDescription(updated.description || '');
      setStages(
        updated.stages.map((stage) => ({
          ...stage,
          tasks: stage.tasks ? [...stage.tasks] : [],
        })),
      );
      showToast('템플릿이 저장되었습니다.', 'success');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.';
      showToast(message, 'error');
    },
  });

  // 🔧 여기서 stage 길이를 인자로 받아서 사용
  const renderTaskRow = (
    stageIndex: number,
    task: StageTemplateTaskDto,
    taskIndex: number,
    tasksLength: number,
  ) => (
    <div
      key={task.id}
      className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-white"
    >
      <CircleDot className="h-4 w-4 text-slate-500 mt-1" />
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="w-full md:w-auto min-w-[200px] flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            value={task.name}
            onChange={(e) => updateTaskField(stageIndex, taskIndex, 'name', e.target.value)}
          />
          {task.isMandatory && <Badge label="필수" tone="amber" />}
          {task.isDefaultActive === false ? (
            <Badge label="기본 비활성" tone="slate" />
          ) : (
            <Badge label="기본 활성" tone="emerald" />
          )}
          {typeof task.defaultDueDays === 'number' && (
            <Badge label={`기본 마감 : +${task.defaultDueDays}일`} tone="blue" />
          )}
        </div>

        {task.description && (
          <p className="text-sm text-slate-600">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={task.isMandatory}
              onChange={(e) =>
                updateTaskField(stageIndex, taskIndex, 'isMandatory', e.target.checked)
              }
            />
            <span>필수</span>
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={task.isDefaultActive !== false}
              onChange={(e) =>
                updateTaskField(stageIndex, taskIndex, 'isDefaultActive', e.target.checked)
              }
            />
            <span>기본 활성</span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => openChecklistModal(task)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm rounded-md border ${
            task.checklistTemplateId
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ListChecks className="h-4 w-4" />
          {task.checklistTemplateId ? task.checklistTemplateName || '체크리스트' : '체크리스트 연결'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => moveTask(stageIndex, taskIndex, 'up')}
          disabled={taskIndex === 0}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => moveTask(stageIndex, taskIndex, 'down')}
          disabled={taskIndex === tasksLength - 1}
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="p-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
          onClick={() => removeTask(stageIndex, taskIndex)}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/templates"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
            목록으로
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">체크리스트 템플릿 상세</h1>
        </div>

        {isLoading && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600">
            불러오는 중…
          </div>
        )}

        {isError && (
          <div className="bg-white border border-red-200 rounded-xl p-6 text-slate-700">
            <p className="font-medium text-red-700">
              템플릿 정보를 불러오는 중 오류가 발생했습니다.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !isError && data && (
          <div className="space-y-6">
            {/* 상단 기본 정보 카드 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-slate-700">
                    템플릿 이름
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-base focus:border-slate-400 focus:outline-none"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="템플릿 이름을 입력하세요"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {data.isDefault && <Badge label="기본 템플릿" tone="blue" />}
                  <Badge
                    label={`단계 ${data.stageCount}개 · 태스크 ${data.taskCount}개`}
                    tone="slate"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">설명</label>
                <textarea
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  rows={3}
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="템플릿에 대한 설명을 입력하세요"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <CalendarClock className="h-4 w-4 text-slate-500" />
                  <span>최종 수정 {formatDate(data.updatedAt, 'PPP')}</span>
                </div>
              </div>
            </div>

            {/* 단계 / 태스크 구조 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-slate-500" />
                <span className="text-lg font-semibold text-slate-900">
                  단계 / 태스크 구조
                </span>
              </div>

              <div className="space-y-6">
                {stages.map((stage, stageIndex) => (
                  <div
                    key={stage.id || `stage-${stageIndex}`}
                    className="space-y-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {stage.name}
                      </h3>
                      <Badge label="필수" tone="amber" />
                      {stage.isDefaultActive === false ? (
                        <Badge label="기본 비활성" tone="slate" />
                      ) : (
                        <Badge label="기본 활성" tone="emerald" />
                      )}
                    </div>

                    {stage.description && (
                      <p className="text-sm text-slate-600">
                        {stage.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      {stage.tasks.map((task, taskIndex) =>
                        renderTaskRow(
                          stageIndex,
                          task,
                          taskIndex,
                          stage.tasks.length,
                        ),
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => addTask(stageIndex)}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />
                      태스크 추가
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => saveTemplate()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-70"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                저장
              </button>
            </div>
          </div>
        )}

        {toast && (
          <div
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-opacity ${
              toast.type === 'error'
                ? 'bg-red-600'
                : toast.type === 'success'
                  ? 'bg-emerald-600'
                  : 'bg-slate-800'
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>

      <TaskTemplateChecklistModal
        isOpen={checklistModalState.isOpen}
        onClose={closeChecklistModal}
        taskTemplateId={checklistModalState.taskTemplateId}
        taskTemplateName={checklistModalState.taskTemplateName}
        currentChecklistTemplateId={checklistModalState.checklistTemplateId}
        currentChecklistTemplateName={checklistModalState.checklistTemplateName}
        onNotify={showToast}
      />
    </AppShell>
  );
}
