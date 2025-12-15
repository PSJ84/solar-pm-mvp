'use client';

// apps/web/app/settings/vendors/page.tsx
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { vendorsApi } from '@/lib/api';
import type { Vendor } from '@/types';

export default function VendorListPage() {
  const queryClient = useQueryClient();
  const vendorQueryKey = ['vendors'];

  const {
    data: vendors,
    isLoading,
    isError,
  } = useQuery<Vendor[]>({
    queryKey: vendorQueryKey,
    queryFn: async () => {
      const res = await vendorsApi.getAll();
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await vendorsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorQueryKey });
    },
  });

  const handleDelete = (id: string, name: string) => {
    const confirmed = window.confirm(`"${name}" 업체를 삭제하시겠습니까? (Soft delete)`);
    if (!confirmed) return;

    deleteMutation.mutate(id);
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-solar-500" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">업체 관리</h1>
              <p className="text-slate-600 text-sm">프로젝트에 연결할 협력업체를 관리하세요.</p>
            </div>
          </div>
          <Link
            href="/settings/vendors/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-solar-500 text-white text-sm font-semibold rounded-lg hover:bg-solar-600"
          >
            <Plus className="h-4 w-4" /> 새 업체 등록
          </Link>
        </div>

        {isLoading && <div className="text-slate-600">업체 목록을 불러오는 중...</div>}
        {isError && <div className="text-red-600">업체 정보를 불러오지 못했습니다.</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          {(vendors || []).map((vendor) => (
            <div key={vendor.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{vendor.name}</h2>
                  {vendor.contact && <p className="text-sm text-slate-600">연락처: {vendor.contact}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/settings/vendors/${vendor.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    수정
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(vendor.id, vendor.name)}
                    className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-slate-700">
                {vendor.bizNo && <p>사업자등록번호: {vendor.bizNo}</p>}
                {vendor.bankAccount && <p>계좌: {vendor.bankAccount}</p>}
                {vendor.address && <p>주소: {vendor.address}</p>}
                {vendor.memo && <p className="text-slate-600">메모: {vendor.memo}</p>}
              </div>
            </div>
          ))}
        </div>

        {!isLoading && vendors?.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-slate-600">
            등록된 업체가 없습니다. 상단의 "새 업체 등록" 버튼을 눌러 추가하세요.
          </div>
        )}
      </div>
    </AppShell>
  );
}
