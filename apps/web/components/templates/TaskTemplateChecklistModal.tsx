'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check, Plus, FileText, Unlink } from 'lucide-react';
import Link from 'next/link';
import { getChecklistTemplates } from '@/lib/api/checklist';
import { templatesApi } from '@/lib/api';
import type { ChecklistTemplate } from '@/types/checklist';

interface TaskTemplateChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTemplateId: string;
  taskTemplateName: string;
  currentChecklistTemplateId: string | null;
  currentChecklistTemplateName: string | null;
}

export function TaskTemplateChecklistModal({
  isOpen,
  onClose,
  taskTemplateId,
  taskTemplateName,
  currentChecklistTemplateId,
  currentChecklistTemplateName,
}: TaskTemplateChecklistModalProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(currentChecklistTemplateId);

  const { data: templates = [], isLoading } = useQuery<ChecklistTemplate[]>({
    queryKey: ['checklist-templates'],
    queryFn: getChecklistTemplates,
    enabled: isOpen,
  });

  const linkMutation = useMutation({
    mutationFn: async (checklistTemplateId: string | null) => {
      const response = await templatesApi.linkChecklistTemplate(taskTemplateId, checklistTemplateId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template'] });
      onClose();
    },
  });

  const handleLink = () => {
    linkMutation.mutate(selectedId);
  };

  const handleUnlink = () => {
    if (confirm('체크리스트 템플릿 연결을 해제하시겠습니까?')) {
      linkMutation.mutate(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold">체크리스트 템플릿 연결</h2>
            <p className="text-sm text-slate-500">{taskTemplateName}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 현재 연결 상태 */}
        {currentChecklistTemplateId && (
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-900">
                  현재 연결: <strong>{currentChecklistTemplateName}</strong>
                </span>
              </div>
              <button
                onClick={handleUnlink}
                disabled={linkMutation.isPending}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                <Unlink className="h-3 w-3" />
                연결 해제
              </button>
            </div>
          </div>
        )}

        {/* 템플릿 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center text-slate-500 py-8">불러오는 중...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">등록된 체크리스트 템플릿이 없습니다.</p>
              <Link
                href="/checklist-templates"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                템플릿 만들기
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedId(template.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    selectedId === template.id
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedId === template.id
                        ? 'border-slate-900 bg-slate-900'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedId === template.id && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{template.name}</div>
                    <div className="text-sm text-slate-500">
                      {template._count?.items ?? template.items?.length ?? 0}개 항목
                    </div>
                  </div>
                  {template.id === currentChecklistTemplateId && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      현재 연결됨
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          <Link
            href="/checklist-templates"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            템플릿 관리 →
          </Link>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              취소
            </button>
            <button
              onClick={handleLink}
              disabled={linkMutation.isPending || selectedId === currentChecklistTemplateId}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {linkMutation.isPending ? '저장 중...' : '연결'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
