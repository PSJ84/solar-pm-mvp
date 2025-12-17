'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { budgetApi } from '@/lib/api';
import type { BudgetCategory, BudgetItem, BudgetProjectResponse } from '@/types/budget';
import type { ProjectVendor } from '@/types';
import { cn } from '@/lib/utils';

interface ProjectBudgetTabProps {
  projectId: string;
  projectVendors: ProjectVendor[];
  onToast: (message: string, type?: 'error' | 'info' | 'success') => void;
}

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(value || 0);

export function ProjectBudgetTab({ projectId, projectVendors, onToast }: ProjectBudgetTabProps) {
  const queryClient = useQueryClient();
  const [amountDrafts, setAmountDrafts] = useState<Record<string, { contract: string; planned: string; actual: string }>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const budgetQueryKey = useMemo(() => ['budget', 'project', projectId], [projectId]);
  const categoriesQueryKey = useMemo(() => ['budget', 'categories'], []);

  const { data: budgetData, isLoading: isBudgetLoading, isError: isBudgetError } = useQuery<BudgetProjectResponse>({
    queryKey: budgetQueryKey,
    queryFn: async () => {
      const res = await budgetApi.getProjectBudget(projectId);
      return res.data;
    },
    enabled: Boolean(projectId),
  });

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery<BudgetCategory[]>({
    queryKey: categoriesQueryKey,
    queryFn: async () => {
      const res = await budgetApi.getCategories();
      return res.data;
    },
  });

  const initializeMutation = useMutation({
    mutationFn: async () => budgetApi.initializeProjectBudget(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetQueryKey });
      onToast('기본 카테고리를 추가했어요.', 'success');
    },
    onError: () => {
      onToast('기본 카테고리를 추가하지 못했어요.', 'error');
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (categoryId: string) =>
      budgetApi.addBudgetItem(projectId, { categoryId, contractAmount: 0, plannedAmount: 0, actualAmount: 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetQueryKey });
      setSelectedCategoryId('');
      onToast('품목을 추가했어요.', 'success');
    },
    onError: () => {
      onToast('품목을 추가하지 못했어요.', 'error');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BudgetItem> }) =>
      budgetApi.updateBudgetItem(id, {
        contractAmount: data.contractAmount,
        plannedAmount: data.plannedAmount,
        actualAmount: data.actualAmount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetQueryKey });
      onToast('금액을 저장했어요.', 'success');
    },
    onError: () => {
      onToast('금액을 저장하지 못했어요.', 'error');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => budgetApi.deleteBudgetItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetQueryKey });
      onToast('품목을 삭제했어요.', 'success');
    },
    onError: () => {
      onToast('품목을 삭제하지 못했어요.', 'error');
    },
  });

  const items = budgetData?.items || [];
  const categories = categoriesData || [];

  useEffect(() => {
    if (!items.length) return;
    setAmountDrafts((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = {
            contract: item.contractAmount?.toString() || '0',
            planned: item.plannedAmount?.toString() || '0',
            actual: item.actualAmount?.toString() || '0',
          };
        }
      });
      return next;
    });
  }, [items]);

  const totals = useMemo(() => {
    if (budgetData) {
      const contractTotal =
        budgetData.contractTotal ?? items.reduce((sum, item) => sum + (item.contractAmount || 0), 0);
      const plannedTotal = budgetData.plannedTotal ?? items.reduce((sum, item) => sum + (item.plannedAmount || 0), 0);
      const actualTotal = budgetData.actualTotal ?? items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
      const actualProfit = budgetData.actualProfit ?? contractTotal - actualTotal;
      return { contractTotal, plannedTotal, actualTotal, actualProfit };
    }
    return { contractTotal: 0, plannedTotal: 0, actualTotal: 0, actualProfit: 0 };
  }, [budgetData, items]);

  const availableCategories = useMemo(() => {
    const usedCategoryIds = new Set(items.map((item) => item.categoryId));
    return categories.filter((category) => !usedCategoryIds.has(category.id));
  }, [categories, items]);

  const handleInitialize = () => {
    initializeMutation.mutate();
  };

  const handleAddItem = () => {
    if (!selectedCategoryId) return;
    addItemMutation.mutate(selectedCategoryId);
  };

  const handleAmountBlur = (item: BudgetItem, field: 'contractAmount' | 'plannedAmount' | 'actualAmount') => {
    const draft = amountDrafts[item.id]?.[
      field === 'contractAmount' ? 'contract' : field === 'plannedAmount' ? 'planned' : 'actual'
    ];
    if (draft === undefined) return;
    const numeric = Number(draft || '0');
    if (Number.isNaN(numeric)) return;
    if (item[field] === numeric) return;
    updateItemMutation.mutate({ id: item.id, data: { [field]: numeric } });
  };

  const handleAmountChange = (itemId: string, field: 'contract' | 'planned' | 'actual', value: string) => {
    setAmountDrafts((prev) => ({
      ...prev,
      [itemId]: {
        contract: prev[itemId]?.contract ?? '0',
        planned: prev[itemId]?.planned ?? '0',
        actual: prev[itemId]?.actual ?? '0',
        [field]: value,
      },
    }));
  };

  const renderSummaryCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: '도급계약 총액', value: totals.contractTotal },
        { label: '실행예정 총액', value: totals.plannedTotal },
        { label: '실제지출 총액', value: totals.actualTotal },
        { label: '실제 손익', value: totals.actualProfit },
      ].map((card) => (
        <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-slate-500">{card.label}</span>
          <span
            className={cn(
              'text-lg font-semibold',
              card.label === '실제 손익'
                ? card.value >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
                : 'text-slate-900',
            )}
          >
            {formatCurrency(card.value)}
          </span>
        </div>
      ))}
    </div>
  );

  const renderItemCard = (item: BudgetItem) => {
    const draft = amountDrafts[item.id] || { contract: '0', planned: '0', actual: '0' };
    const vendorName =
      item.vendor?.name ||
      projectVendors.find((pv) => pv.vendor?.id === (item.vendorId || item.vendor?.id || ''))?.vendor?.name ||
      '-';
    const diff = (item.contractAmount || 0) - (item.actualAmount || 0);

    return (
      <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">{item.category?.name || '카테고리'}</p>
            <p className="text-xs text-slate-500">업체: {vendorName}</p>
          </div>
          <button
            type="button"
            onClick={() => deleteItemMutation.mutate(item.id)}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50"
            aria-label="품목 삭제"
            disabled={deleteItemMutation.isPending}
          >
            {deleteItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">계약금액</span>
            <input
              type="number"
              value={draft.contract}
              onChange={(e) => handleAmountChange(item.id, 'contract', e.target.value)}
              onBlur={() => handleAmountBlur(item, 'contractAmount')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-solar-300 focus:border-solar-400"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">실행예정</span>
            <input
              type="number"
              value={draft.planned}
              onChange={(e) => handleAmountChange(item.id, 'planned', e.target.value)}
              onBlur={() => handleAmountBlur(item, 'plannedAmount')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-solar-300 focus:border-solar-400"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">실제지출</span>
            <input
              type="number"
              value={draft.actual}
              onChange={(e) => handleAmountChange(item.id, 'actual', e.target.value)}
              onBlur={() => handleAmountBlur(item, 'actualAmount')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-solar-300 focus:border-solar-400"
            />
          </label>
          <div className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">차액</span>
            <p className={cn('text-base font-semibold', diff >= 0 ? 'text-green-600' : 'text-red-600')}>
              {diff >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(diff))}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (isBudgetLoading || isCategoriesLoading) {
    return (
      <div className="space-y-4 pb-16">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          예산 정보를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  if (isBudgetError) {
    return (
      <div className="space-y-4 pb-16">
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-5 w-5" />
          예산 정보를 불러오지 못했어요. 다시 시도해주세요.
        </div>
        <button
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: budgetQueryKey })}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
        >
          <RefreshCcw className="h-4 w-4" /> 새로고침
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {renderSummaryCards()}

      <div className="flex flex-col gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Plus className="h-4 w-4 text-solar-500" /> 품목 추가
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-solar-300 focus:border-solar-400"
            >
              <option value="">추가할 카테고리를 선택하세요</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!selectedCategoryId || addItemMutation.isPending}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-solar-500 text-white rounded-lg hover:bg-solar-600 disabled:opacity-60"
            >
              {addItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              추가
            </button>
          </div>
        </div>
        {!availableCategories.length && (
          <p className="text-xs text-slate-500">추가 가능한 카테고리가 없습니다.</p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-slate-700">아직 예산 품목이 없습니다.</p>
          <p className="text-xs text-slate-500">기본 카테고리를 추가해 예산 관리를 시작하세요.</p>
          {!categories.length && (
            <p className="text-xs text-red-500">기본 카테고리가 DB에 없습니다. 초기화 버튼을 눌러 자동 생성하세요.</p>
          )}
          <button
            type="button"
            onClick={handleInitialize}
            disabled={initializeMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-solar-500 text-white rounded-lg hover:bg-solar-600 disabled:opacity-60"
          >
            {initializeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            기본 카테고리 추가
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => renderItemCard(item))}
        </div>
      )}
    </div>
  );
}
