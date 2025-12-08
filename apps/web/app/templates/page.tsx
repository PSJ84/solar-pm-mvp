// apps/web/app/templates/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, ChevronDown, ChevronRight, ChevronUp, Layers, ListChecks, Plus, Trash2 } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templates, setTemplates] = useState<TemplateListItemDto[]>([]);
  const { data, isLoading, isError, refetch } = useQuery<TemplateListItemDto[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await templatesApi.getAll();
      return res.data;
    },
  });

  useEffect(() => {
    if (data) {
      setTemplates(data);
    }
  }, [data]);

  const createTemplate = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const res = await templatesApi.create(payload);
      return res.data;
    },
    onSuccess: () => {
      setTemplateName('');
      setTemplateDescription('');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: () => {
      alert('템플릿 생성에 실패했습니다.');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => templatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: () => {
      alert('템플릿 삭제에 실패했습니다.');
    },
  });

  const reorderTemplates = useMutation({
    mutationFn: async (templateIds: string[]) => {
      const res = await templatesApi.reorder(templateIds);
      return res.data as TemplateListItemDto[];
    },
    onSuccess: (ordered) => {
      if (ordered) {
        setTemplates(ordered);
      }
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: () => {
      alert('템플릿 순서를 저장하지 못했습니다.');
      if (data) setTemplates(data);
    },
  });

  const handleDeleteTemplate = (id: string) => {
    const confirmed = window.confirm('선택한 템플릿을 삭제하시겠습니까?');
    if (!confirmed) return;
    deleteTemplate.mutate(id);
  };

  const handleReorder = (index: number, direction: number) => {
    setTemplates((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const updated = [...current];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

      const orderedIds = updated.map((t) => t.id);
      reorderTemplates.mutate(orderedIds, {
        onError: () => {
          setTemplates(current);
        },
      });

      return updated;
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">체크리스트 템플릿 관리</h1>
            <p className="text-slate-600 mt-1">프로젝트 생성 시 사용할 체크리스트 템플릿들을 관리합니다.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>새 템플릿 추가</span>
          </button>
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
            {(templates || []).length === 0 && (
              <div className="col-span-full bg-white border border-slate-200 rounded-xl p-6 text-slate-600">
                등록된 템플릿이 없습니다. 기본 템플릿을 추가해 주세요.
              </div>
            )}

            {(templates || []).map((template, index) => (
              <div key={template.id} className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                  className="absolute top-3 right-3 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  aria-label={`${template.name} 삭제`}
                  disabled={deleteTemplate.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="absolute left-3 top-3 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleReorder(index, -1);
                    }}
                    disabled={index === 0 || reorderTemplates.isPending}
                    className="p-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                    aria-label="위로 이동"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleReorder(index, 1);
                    }}
                    disabled={index === templates.length - 1 || reorderTemplates.isPending}
                    className="p-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                    aria-label="아래로 이동"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <Link
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
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">새 템플릿 추가</h3>
              <p className="text-sm text-slate-600">템플릿 이름과 설명을 입력하세요.</p>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-slate-700 space-y-1">
                <span>템플릿 이름</span>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 사업타당성 검토"
                />
              </label>
              <label className="block text-sm text-slate-700 space-y-1">
                <span>설명 (선택)</span>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="프로젝트 생성 시 사용할 체크리스트 설명"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setTemplateName('');
                  setTemplateDescription('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!templateName.trim() || createTemplate.isPending}
                onClick={() =>
                  createTemplate.mutate({ name: templateName.trim(), description: templateDescription.trim() || undefined })
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {createTemplate.isPending ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}