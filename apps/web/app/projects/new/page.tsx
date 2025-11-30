// apps/web/app/projects/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await projectsApi.create({
        name,
        address,
        capacityKw: capacity === '' ? undefined : Number(capacity),
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push(`/projects/${data.id}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <p className="text-sm text-slate-500">새 프로젝트</p>
            <h1 className="text-xl font-bold text-slate-900">프로젝트 기본 정보 입력</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">프로젝트 이름 *</label>
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="예: 충남 서산 태양광 발전소"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">주소</label>
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="예: 충청남도 서산시 ..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">발전 용량 (kW)</label>
            <input
              type="number"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="예: 998.5"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : '')}
              step="0.1"
              min="0"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> 저장 중...
                </span>
              ) : (
                '저장 후 바로 이동'
              )}
            </button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-600">프로젝트 생성 중 오류가 발생했습니다. 다시 시도해 주세요.</p>
          )}
        </form>
      </main>
    </div>
  );
}
