'use client';

import { useState } from 'react';
import { useApplyTemplate, useChecklistTemplates } from '@/hooks/useChecklist';

interface Props {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChecklistTemplateModal({ taskId, isOpen, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: templates, isLoading } = useChecklistTemplates();
  const applyMutation = useApplyTemplate(taskId);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (!selectedId) return;
    await applyMutation.mutateAsync(selectedId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-slate-900">📑 템플릿에서 불러오기</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-slate-500 py-6">로딩 중...</div>
          ) : templates && templates.length > 0 ? (
            <div className="space-y-2">
              {templates.map((template) => (
                <label
                  key={template.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${
                    selectedId === template.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    checked={selectedId === template.id}
                    onChange={() => setSelectedId(template.id)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{template.name}</div>
                    {template.description && (
                      <div className="text-sm text-slate-500 truncate">{template.description}</div>
                    )}
                    <div className="text-xs text-slate-400 mt-1">
                      {(template._count?.items ?? template.items?.length ?? 0)}개 항목
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-6">등록된 템플릿이 없습니다.</div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedId || applyMutation.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applyMutation.isPending ? '적용 중...' : '불러오기'}
          </button>
        </div>
      </div>
    </div>
  );
}
