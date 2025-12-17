// apps/web/lib/api/budget.ts
import type { BudgetCategory, BudgetItem, BudgetProjectResponse } from '@/types/budget';
import { api } from './client';

export const budgetApi = {
  getCategories: () => api.get<BudgetCategory[]>('/budget/categories'),
  createCategory: (data: { name: string }) => api.post<BudgetCategory>('/budget/categories', data),
  deleteCategory: (id: string) => api.delete(`/budget/categories/${id}`),
  getProjectBudget: (projectId: string) => api.get<BudgetProjectResponse>(`/budget/projects/${projectId}`),
  initializeProjectBudget: (projectId: string) => api.post(`/budget/projects/${projectId}/initialize`, {}),
  addBudgetItem: (
    projectId: string,
    data: { categoryId: string; contractAmount?: number; plannedAmount?: number; actualAmount?: number },
  ) => api.post<BudgetItem>(`/budget/projects/${projectId}/items`, data),
  updateBudgetItem: (
    itemId: string,
    data: Partial<Pick<BudgetItem, 'contractAmount' | 'plannedAmount' | 'actualAmount'>>,
  ) => api.patch<BudgetItem>(`/budget/items/${itemId}`, data),
  deleteBudgetItem: (itemId: string) => api.delete(`/budget/items/${itemId}`),
};
