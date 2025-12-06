// apps/web/app/templates/[id]/page.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, ChevronLeft, CircleDot, ListChecks } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { templatesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { TemplateDetailDto, StageTemplateStageDto, StageTemplateTaskDto } from '@shared/types/template.types';

const Badge = ({ label, tone = 'slate' }: { label: string; tone?: 'slate' | 'blue' | 'amber' | 'emerald' }) => {
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

const TaskRow = ({ task }: { task: StageTemplateTaskDto }) => (
  <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-white">
    <CircleDot className="h-4 w-4 text-slate-500 mt-1" />
    <div className="flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-slate-900">{task.name}</span>
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
      {task.description && <p className="text-sm text-slate-600 mt-1">{task.description}</p>}
    </div>
  </div>
);

const StageBlock = ({ stage }: { stage: StageTemplateStageDto }) => (
  <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="text-lg font-semibold text-slate-900">{stage.name}</h3>
      <Badge label="필수" tone="amber" />
      {stage.isDefaultActive === false ? (
        <Badge label="기본 비활성" tone="slate" />
      ) : (
        <Badge label="기본 활성" tone="emerald" />
      )}
    </div>
    {stage.description && <p className="text-sm text-slate-600">{stage.description}</p>}
    <div className="space-y-2">
      {stage.tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </div>
  </div>
);

export default function TemplateDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const idValue = params?.id;
  const templateId = Array.isArray(idValue) ? idValue[0] : idValue ? String(idValue) : '';
  const hasTemplateId = Boolean(templateId);

  const { data, isLoading, isError, refetch } = useQuery<TemplateDetailDto>({
    queryKey: ['template', templateId],
    queryFn: async () => {
      const res = await templatesApi.getOne(templateId);
      return res.data;
    },
    enabled: hasTemplateId,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/templates"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" /> 목록으로
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">체크리스트 템플릿 상세</h1>
        </div>

        {isLoading && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600">불러오는 중…</div>
        )}

        {isError && (
          <div className="bg-white border border-red-200 rounded-xl p-6 text-slate-700">
            <p className="font-medium text-red-700">템플릿 정보를 불러오는 중 오류가 발생했습니다.</p>
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
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-900">{data.name}</h2>
                {data.isDefault && <Badge label="기본 템플릿" tone="blue" />}
                <Badge label={`단계 ${data.stageCount}개 · 태스크 ${data.taskCount}개`} tone="slate" />
              </div>
              {data.description && <p className="text-slate-700">{data.description}</p>}
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <CalendarClock className="h-4 w-4 text-slate-500" />
                  <span>최종 수정 {formatDate(data.updatedAt, 'PPP')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-slate-500" />
                <span className="text-lg font-semibold text-slate-900">단계 / 태스크 구조</span>
              </div>
              <div className="space-y-6">
                {data.stages.map((stage) => (
                  <div key={stage.id} className="space-y-3">
                    <StageBlock stage={stage} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
