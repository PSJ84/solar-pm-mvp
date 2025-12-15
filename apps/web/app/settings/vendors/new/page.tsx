'use client';

// apps/web/app/settings/vendors/new/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { vendorsApi } from '@/lib/api';

export default function NewVendorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const vendorQueryKey = ['vendors'];

  const [form, setForm] = useState({
    name: '',
    contact: '',
    bizNo: '',
    bankAccount: '',
    address: '',
    memo: '',
  });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      await vendorsApi.create(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorQueryKey });
      router.push('/settings/vendors');
    },
    onError: () => {
      setError('업체를 생성하지 못했습니다. 입력값을 확인해주세요.');
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('업체명을 입력하세요.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-16">
        <div className="flex items-center gap-3">
          <Link
            href="/settings/vendors"
            className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">새 업체 등록</h1>
            <p className="text-slate-600 text-sm">프로젝트에서 사용할 업체 정보를 입력하세요.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">업체명 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-solar-400 focus:ring-2 focus:ring-solar-200"
              placeholder="업체명을 입력하세요"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">연락처</label>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-solar-400 focus:ring-2 focus:ring-solar-200"
                placeholder="010-0000-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">사업자등록번호</label>
              <input
                type="text"
                value={form.bizNo}
                onChange={(e) => handleChange('bizNo', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-solar-400 focus:ring-2 focus:ring-solar-200"
                placeholder="123-45-67890"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">계좌 정보</label>
            <input
              type="text"
              value={form.bankAccount}
              onChange={(e) => handleChange('bankAccount', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-solar-400 focus:ring-2 focus:ring-solar-200"
              placeholder="은행명 / 계좌번호"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">주소</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-solar-400 focus:ring-2 focus:ring-solar-200"
              placeholder="주소를 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => handleChange('memo', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-solar-400 focus:ring-2 focus:ring-solar-200"
              rows={3}
              placeholder="특이사항을 입력하세요"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-solar-500 text-white font-semibold rounded-lg hover:bg-solar-600 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {createMutation.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
