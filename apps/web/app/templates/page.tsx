// apps/web/app/templates/page.tsx
'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, ChevronRight, Layers, ListChecks } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { templatesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { TemplateListItemDto } from '@shared/types/template.types';

const TemplateCardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 animate-pulse">
    <div className="h-5 bg-slate-200 rounded w-2/3" />
    <div className="h-4 bg-slate-200 rounded w-full" />
    <div className="flex items-center gap-3 text-sm text-slate-500">
      <div className="h-4 bg-slate-200 rounded w-24" />
      <div className="h-4 bg-slate-200 rounded w-28" />
    </div>
  </div>
);

export default function TemplatesPage() {
  const { data, isLoading, isError, refetch } = useQuery<TemplateListItemDto[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await templatesApi.getAll();
      return res.data;
    },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">체크리스트 템플릿 관리</h1>
          <p className="text-slate-600 mt-1">프로젝트 생성 시 사용할 체크리스트 템플릿들을 관리합니다.</p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <TemplateCardSkeleton key={`template-skeleton-${idx}`} />
            ))}
          </div>
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

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data || []).length === 0 && (
              <div className="col-span-full bg-white border border-slate-200 rounded-xl p-6 text-slate-600">
                등록된 템플릿이 없습니다. 기본 템플릿을 추가해 주세요.
              </div>
            )}

            {(data || []).map((template) => (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
                    {template.description && (
                      <p className="text-slate-600 text-sm mt-1 line-clamp-2">{template.description}</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4 text-slate-500" />
                    <span>단계 {template.stageCount}개</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ListChecks className="h-4 w-4 text-slate-500" />
                    <span>태스크 {template.taskCount}개</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarClock className="h-4 w-4 text-slate-500" />
                    <span>{formatDate(template.updatedAt, 'PPP')}</span>
                  </div>
                  {template.isDefault && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      기본 템플릿
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
