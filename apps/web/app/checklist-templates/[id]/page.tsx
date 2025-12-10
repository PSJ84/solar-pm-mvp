'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, ChevronLeft, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  addChecklistTemplateItem,
  deleteChecklistTemplateItem,
  getChecklistTemplate,
  reorderChecklistTemplateItems,
  updateChecklistTemplate,
  updateChecklistTemplateItem,
} from '@/lib/api/checklist';
import type { ChecklistTemplate, ChecklistTemplateItem } from '@/types/checklist';

export default function ChecklistTemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const templateId = params?.id ?? '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ChecklistTemplateItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemHasExpiry, setNewItemHasExpiry] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { data: template, isLoading } = useQuery<ChecklistTemplate>({
    queryKey: ['checklist-template', templateId],
    queryFn: () => getChecklistTemplate(templateId),
    enabled: !!templateId,
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setItems([...(template.items ?? [])].sort((a, b) => a.order - b.order));
    }
  }, [template]);

  const updateTemplateMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      updateChecklistTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-template', templateId] });
    },
  });

const addItemMutation = useMutation({
    mutationFn: (data: { title: string; hasExpiry: boolean; order: number }) =>
      addChecklistTemplateItem(templateId, data),
    onSuccess: (createdItem) => {
      setItems((prev) => [...prev, createdItem].sort((a, b) => a.order - b.order));
      queryClient.invalidateQueries({ queryKey: ['checklist-template', templateId] });
      setNewItemTitle('');
      setNewItemHasExpiry(false);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: { title?: string; hasExpiry?: boolean } }) =>
      updateChecklistTemplateItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-template', templateId] });
      setEditingItemId(null);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deleteChecklistTemplateItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-template', templateId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (itemIds: string[]) => reorderChecklistTemplateItems(templateId, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-template', templateId] });
    },
  });

  const handleSaveTemplate = () => {
    if (!templateId) return;
    updateTemplateMutation.mutate({ name, description: description || undefined });
  };

const handleAddItem = () => {
  if (!newItemTitle.trim()) return;
  addItemMutation.mutate({
    title: newItemTitle.trim(),
    hasExpiry: newItemHasExpiry,
    order: items.length,
  });
};

  const handleUpdateItem = (itemId: string) => {
    if (!editingTitle.trim()) return;
    updateItemMutation.mutate({ itemId, data: { title: editingTitle.trim() } });
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setItems((prev) => {
      const newItems = [...prev];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(index, 0, draggedItem);
      return newItems;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      const itemIds = items.map((item) => item.id);
      reorderMutation.mutate(itemIds);
    }
    setDraggedIndex(null);
  };

  const startEditing = (item: ChecklistTemplateItem) => {
    setEditingItemId(item.id);
    setEditingTitle(item.title);
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </AppShell>
    );
  }

  if (!template) {
    return (
      <AppShell>
        <div className="space-y-4 py-12 text-center">
          <p className="text-lg font-semibold text-slate-900">템플릿을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/checklist-templates')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
            목록으로 돌아가기
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Link
            href="/checklist-templates"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
            목록으로
          </Link>
        </div>

        {/* 템플릿 정보 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">템플릿 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveTemplate}
              disabled={updateTemplateMutation.isPending}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {updateTemplateMutation.isPending ? '저장 중...' : '정보 저장'}
            </button>
          </div>
        </div>

        {/* 아이템 목록 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">체크리스트 항목 ({items.length}개)</h2>

          {/* 아이템 리스트 */}
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="h-4 w-4 text-slate-400 cursor-grab" />
                <span className="text-sm text-slate-500 w-6">{index + 1}</span>

                {editingItemId === item.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleUpdateItem(item.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateItem(item.id)}
                    autoFocus
                    className="flex-1 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:border-slate-400"
                  />
                ) : (
                  <span
                    className="flex-1 cursor-pointer hover:text-slate-700"
                    onClick={() => startEditing(item)}
                  >
                    {item.title}
                  </span>
                )}

                {item.hasExpiry && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">
                    <Calendar className="h-3 w-3" />
                    만료일
                  </span>
                )}

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* 새 항목 추가 */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="새 항목 추가..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            />
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={newItemHasExpiry}
                onChange={(e) => setNewItemHasExpiry(e.target.checked)}
              />
              만료일 있음
            </label>
            <button
              onClick={handleAddItem}
              disabled={!newItemTitle.trim() || addItemMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {addItemMutation.isPending ? '추가 중...' : '추가'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
