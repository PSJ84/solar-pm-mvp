'use client';

import { useState } from 'react';
import {
  useChecklist,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from '@/hooks/useChecklist';
import { ChecklistProgress } from './ChecklistProgress';
import { ChecklistItemRow } from './ChecklistItemRow';
import { ChecklistTemplateModal } from './ChecklistTemplateModal';
import type { ChecklistStatus } from '@/types/checklist';

interface Props {
  taskId: string;
  defaultExpanded?: boolean;
}

export function ChecklistPanel({ taskId, defaultExpanded = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const { data, isLoading, error } = useChecklist(taskId);
  const createMutation = useCreateChecklistItem(taskId);
  const updateMutation = useUpdateChecklistItem(taskId);
  const deleteMutation = useDeleteChecklistItem(taskId);

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;

    await createMutation.mutateAsync({ title: newItemTitle.trim() });
    setNewItemTitle('');
  };

  const handleStatusChange = (itemId: string, status: ChecklistStatus) => {
    updateMutation.mutate({ id: itemId, data: { status } });
  };

  const handleMemoChange = (itemId: string, memo: string) => {
    updateMutation.mutate({ id: itemId, data: { memo } });
  };

  const handleDelete = (itemId: string) => {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
      deleteMutation.mutate(itemId);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-gray-500">로딩 중...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">체크리스트를 불러올 수 없습니다.</div>;
  }

  const { items, summary } = data || { items: [], summary: { total: 0, completed: 0, progress: 0 } };

  return (
    <div className="border rounded-lg bg-white">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">📋 체크리스트</span>
          {summary.total > 0 && <span className="text-sm text-gray-500">[{summary.completed}/{summary.total}]</span>}
        </div>
        <div className="flex items-center gap-3">
          {summary.total > 0 && (
            <div className="w-24">
              <ChecklistProgress summary={summary} />
            </div>
          )}
          <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t">
          {items.length > 0 ? (
            <div>
              {items.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  onStatusChange={(status) => handleStatusChange(item.id, status)}
                  onMemoChange={(memo) => handleMemoChange(item.id, memo)}
                  onDelete={() => handleDelete(item.id)}
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm">체크리스트가 없습니다.</div>
          )}

          <div className="p-3 border-t bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                placeholder="+ 새 항목 추가..."
                className="flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!newItemTitle.trim() || createMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                추가
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="mt-2 w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-dashed border-blue-300"
            >
              📑 템플릿에서 불러오기
            </button>
          </div>
        </div>
      )}

      <ChecklistTemplateModal
        taskId={taskId}
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
      />
    </div>
  );
}