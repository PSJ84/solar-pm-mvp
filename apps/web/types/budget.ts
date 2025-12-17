// apps/web/types/budget.ts
import type { Vendor } from './index';

export interface BudgetCategory {
  id: string;
  name: string;
  order?: number;
}

export interface BudgetItem {
  id: string;
  projectId: string;
  categoryId: string;
  contractAmount: number;
  plannedAmount: number;
  actualAmount: number;
  vendorId?: string | null;
  category?: BudgetCategory | null;
  vendor?: Vendor | null;
}

export interface BudgetProjectResponse {
  items: BudgetItem[];
  contractTotal?: number;
  plannedTotal?: number;
  actualTotal?: number;
  actualProfit?: number;
}
