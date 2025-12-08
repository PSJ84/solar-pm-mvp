// apps/web/components/tasks/AddTaskModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAvailableTaskTemplates, useCreateTask, useCreateTaskFromTemplate } from '@/hooks/useTasks';
import type { AvailableTaskTemplate } from '@/types/task-template';

interface Props {
  stageId: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddTaskModal({ stageId, projectId, isOpen, onClose }: Props) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [mode, setMode] = useState<'template' | 'custom'>('template');

  const { data, isLoading } = useAvailableTaskTemplates(stageId);
  const createFromTemplate = useCreateTaskFromTemplate(stageId, projectId);
  const createCustomTask = useCreateTask(stageId, projectId);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTemplateId(null);
      setNewTaskTitle('');
      setMode('template');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplateId) return;
    await createFromTemplate.mutateAsync(selectedTemplateId);
    onClose();
  };

  const handleCreateCustomTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createCustomTask.mutateAsync({ title: newTaskTitle.trim() });
    onClose();
  };

  const templates = data?.templates || [];
  const availableTemplates = templates.filter((t) => !t.alreadyAdded);
  const addedTemplates = templates.filter((t) => t.alreadyAdded);

  const TemplateCard = ({ template }: { template: AvailableTaskTemplate }) => (
    <label
      key={template.id}
      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
        selectedTemplateId === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <input
        type="radio"
        name="template"
        checked={selectedTemplateId === template.id}
        onChange={() => {
          setSelectedTemplateId(template.id);
          setMode('template');
        }}
        className="mt-1 w-4 h-4"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{template.title}</span>
          {template.isMandatory && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">필수</span>
          )}
        </div>
        {template.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
        )}
        {template.checklistTemplate && (
          <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
            <span>📋</span>
            <span>체크리스트 {template.checklistTemplate.itemCount}개 포함</span>
          </div>
        )}
      </div>
    </label>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">태스크 추가</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 템플릿 선택 섹션 */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">📋 템플릿에서 선택</h4>

            {isLoading ? (
              <div className="text-center text-gray-500 py-4">로딩 중...</div>
            ) : availableTemplates.length === 0 && addedTemplates.length === 0 ? (
              <div className="text-center text-gray-500 py-4 bg-gray-50 rounded">
                이 단계에 등록된 템플릿이 없습니다.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}

                {addedTemplates.length > 0 && (
                  <>
                    <div className="text-xs text-gray-400 mt-4 mb-2">이미 추가됨</div>
                    {addedTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50 opacity-60"
                      >
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-500 truncate">{template.title}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-sm text-gray-400">또는</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* 직접 입력 섹션 */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">✏️ 신규 태스크 직접 입력</h4>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => {
                setNewTaskTitle(e.target.value);
                if (e.target.value) {
                  setMode('custom');
                  setSelectedTemplateId(null);
                }
              }}
              onFocus={() => setMode('custom')}
              placeholder="태스크 제목을 입력하세요..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            취소
          </button>

          {mode === 'template' ? (
            <button
              onClick={handleCreateFromTemplate}
              disabled={!selectedTemplateId || createFromTemplate.isPending}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createFromTemplate.isPending ? '추가 중...' : '선택한 템플릿 추가'}
            </button>
          ) : (
            <button
              onClick={handleCreateCustomTask}
              disabled={!newTaskTitle.trim() || createCustomTask.isPending}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createCustomTask.isPending ? '추가 중...' : '신규 태스크 추가'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
