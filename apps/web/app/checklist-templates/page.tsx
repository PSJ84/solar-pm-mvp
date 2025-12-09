'use client';

import { useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Trash2, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { createChecklistTemplate, deleteChecklistTemplate, getChecklistTemplates } from '@/lib/api/checklist';
import type { ChecklistTemplate } from '@/types/checklist';

export default function ChecklistTemplatesPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const { data: templates = [], isLoading } = useQuery<ChecklistTemplate[]>({
    queryKey: ['checklist-templates'],
    queryFn: getChecklistTemplates,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => createChecklistTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteChecklistTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim(), description: newDescription.trim() || undefined });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">체크리스트 템플릿</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            새 템플릿
          </button>
        </div>

        {isLoading ? (
          <div className="text-slate-500">불러오는 중...</div>
        ) : templates.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            등록된 체크리스트 템플릿이 없습니다.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/checklist-templates/${template.id}`}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <FileText className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{template.name}</h3>
                      <p className="text-sm text-slate-500">
                        {template._count?.items ?? template.items?.length ?? 0}개 항목
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(template.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {template.description && (
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{template.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 생성 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">새 체크리스트 템플릿</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">템플릿 이름 *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 발전사업허가 기본서류"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="템플릿에 대한 설명"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || createMutation.isPending}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
                >
                  {createMutation.isPending ? '생성 중...' : '생성'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
