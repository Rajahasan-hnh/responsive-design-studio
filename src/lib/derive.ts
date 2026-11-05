import type { Budget, Category, Transaction, TxType } from "@/lib/types";
import { monthStartOffset } from "@/lib/format";

/** Pure client-side aggregations shared by the pages. */

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

export function sumOf(txs: Transaction[], type?: TxType, withinMonths?: string[]): number {
  return txs.reduce((acc, t) => {
    if (type && t.type !== type) return acc;
    if (withinMonths && !withinMonths.includes(monthKeyOf(t.occurred_on))) return acc;
    return acc + Number(t.amount);
  }, 0);
}

export function balanceOf(txs: Transaction[]): number {
  return sumOf(txs, "income") - sumOf(txs, "expense");
}

export interface MonthlyPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export function monthlySeries(txs: Transaction[], months = 6): MonthlyPoint[] {
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) keys.push(monthStartOffset(i).slice(0, 7));
  const points = keys.map((month) => ({
    month,
    label: new Date(`${month}-01T00:00:00`).toLocaleDateString("en-PK", { month: "short" }),
    income: 0,
    expense: 0,
  }));
  const byKey = new Map(points.map((p) => [p.month, p]));
  for (const t of txs) {
    const point = byKey.get(monthKeyOf(t.occurred_on));
    if (!point) continue;
    if (t.type === "income") point.income += Number(t.amount);
    else point.expense += Number(t.amount);
  }
  return points;
}

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

export function categoryBreakdown(
  txs: Transaction[],
  categories: Category[],
  type: TxType,
  month?: string,
): CategorySlice[] {
  const totals = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== type) continue;
    if (month && monthKeyOf(t.occurred_on) !== month) continue;
    const key = t.category_id ?? "uncategorized";
    totals.set(key, (totals.get(key) ?? 0) + Number(t.amount));
  }
  const byId = new Map(categories.map((c) => [c.id, c]));
  const slices: CategorySlice[] = [];
  for (const [key, value] of totals) {
    const category = key === "uncategorized" ? undefined : byId.get(key);
    slices.push({
      name: category?.name ?? "Uncategorized",
      value,
      color: category?.color ?? "#7a8aa0",
    });
  }
  return slices.sort((a, b) => b.value - a.value);
}

export interface BudgetRow {
  budget: Budget;
  category: Category;
  spent: number;
  limit: number;
  pct: number;
}

export function budgetRows(
  budgets: Budget[],
  categories: Category[],
  txs: Transaction[],
  month: string,
): BudgetRow[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return budgets
    .map((budget) => {
      const category = byId.get(budget.category_id);
      const spent = txs.reduce(
        (acc, t) =>
          t.type === "expense" && t.category_id === budget.category_id && monthKeyOf(t.occurred_on) === month
            ? acc + Number(t.amount)
            : acc,
        0,
      );
      const limit = Number(budget.monthly_limit);
      return {
        budget,
        category: category ?? { id: budget.category_id, name: "Unknown", kind: "expense" as TxType, color: "#7a8aa0" },
        spent,
        limit,
        pct: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      };
    })
    .sort((a, b) => b.pct - a.pct);
}
