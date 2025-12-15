'use client';

// apps/web/app/settings/vendors/[id]/page.tsx
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { vendorsApi } from '@/lib/api';
import type { Vendor } from '@/types';

export default function VendorDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const vendorQueryKey = ['vendors'];
  const idValue = params?.id;
  const vendorId = Array.isArray(idValue) ? idValue[0] : idValue ? String(idValue) : '';

  const [form, setForm] = useState({
    name: '',
    contact: '',
    bizNo: '',
    bankAccount: '',
    address: '',
    memo: '',
  });
  const [error, setError] = useState<string | null>(null);

  const { data: vendor, isLoading } = useQuery<Vendor>({
    queryKey: ['vendor', vendorId],
    enabled: Boolean(vendorId),
    queryFn: async () => {
      const res = await vendorsApi.getOne(vendorId);
      return res.data;
    },
  });

  useEffect(() => {
    if (!vendor) return;
    setForm({
      name: vendor.name || '',
      contact: vendor.contact || '',
      bizNo: vendor.bizNo || '',
      bankAccount: vendor.bankAccount || '',
      address: vendor.address || '',
      memo: vendor.memo || '',
    });
  }, [vendor]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await vendorsApi.update(vendorId, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorQueryKey });
      queryClient.invalidateQueries({ queryKey: ['vendor', vendorId] });
    },
    onError: () => {
      setError('업체 정보를 저장하지 못했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await vendorsApi.delete(vendorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorQueryKey });
      router.push('/settings/vendors');
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
    updateMutation.mutate();
  };

  const handleDelete = () => {
    const confirmed = window.confirm('이 업체를 삭제하시겠습니까? (Soft delete)');
    if (!confirmed) return;
    deleteMutation.mutate();
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
            <h1 className="text-2xl font-bold text-slate-900">업체 상세</h1>
            <p className="text-slate-600 text-sm">업체 정보를 수정하고 프로젝트에 활용하세요.</p>
          </div>
        </div>

        {isLoading && <div className="text-slate-600">업체 정보를 불러오는 중입니다...</div>}
        {!vendorId && <div className="text-red-600">업체 ID가 유효하지 않습니다.</div>}

        {vendor && (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">업체명 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-solar-400 focus:ring-2 focus:ring-solar-200"
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
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">사업자등록번호</label>
                <input
                  type="text"
                  value={form.bizNo}
                  onChange={(e) => handleChange('bizNo', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-solar-400 focus:ring-2 focus:ring-solar-200"
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
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">주소</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-solar-400 focus:ring-2 focus:ring-solar-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">메모</label>
              <textarea
                value={form.memo}
                onChange={(e) => handleChange('memo', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-solar-400 focus:ring-2 focus:ring-solar-200"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 text-red-600 border border-red-100 rounded-lg hover:bg-red-50"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" /> 삭제
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-solar-500 text-white font-semibold rounded-lg hover:bg-solar-600 disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {updateMutation.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
