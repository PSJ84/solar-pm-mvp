'use client';

import { useState } from 'react';
import { ChecklistStatusBadge } from './ChecklistStatusBadge';
import type { ChecklistItem, ChecklistStatus } from '@/types/checklist';

interface Props {
  item: ChecklistItem;
  onStatusChange: (status: ChecklistStatus) => void;
  onMemoChange: (memo: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function ChecklistItemRow({ item, onStatusChange, onMemoChange, onDelete, disabled }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [memoValue, setMemoValue] = useState(item.memo || '');
  const [isEditingMemo, setIsEditingMemo] = useState(false);

  const isExpiringSoon =
    item.expiresAt && new Date(item.expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const handleMemoSave = () => {
    onMemoChange(memoValue);
    setIsEditingMemo(false);
  };

  return (
    <div className="border-b last:border-b-0">
      <div className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50">
        <ChecklistStatusBadge status={item.status} onChange={onStatusChange} disabled={disabled} />
        <span className="flex-1 text-sm">{item.title}</span>
        {isExpiringSoon && (
          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            만료임박 {new Date(item.expiresAt!).toLocaleDateString('ko-KR')}
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          {item.memo ? '📝' : ''}
          {isExpanded ? '▲' : '▼'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="text-gray-400 hover:text-red-500 disabled:opacity-50"
        >
          🗑️
        </button>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pl-12 bg-gray-50">
          <div className="mt-2">
            {isEditingMemo ? (
              <div className="flex gap-2">
                <textarea
                  value={memoValue}
                  onChange={(e) => setMemoValue(e.target.value)}
                  className="flex-1 text-sm border rounded px-2 py-1 resize-none"
                  rows={2}
                  placeholder="메모를 입력하세요..."
                />
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={handleMemoSave}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMemoValue(item.memo || '');
                      setIsEditingMemo(false);
                    }}
                    className="px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsEditingMemo(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingMemo(true);
                }}
                className="text-sm text-gray-600 cursor-pointer hover:bg-white p-2 rounded border border-transparent hover:border-gray-200"
              >
                {item.memo || '메모를 입력하려면 클릭하세요...'}
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>발급일: {item.issuedAt ? new Date(item.issuedAt).toLocaleDateString('ko-KR') : '-'}</span>
            <span>만료일: {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString('ko-KR') : '-'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
