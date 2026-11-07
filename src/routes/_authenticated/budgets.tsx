import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/page";
import { deleteBudget, listBudgets, listCategories, listTransactions, upsertBudget } from "@/lib/api";
import { budgetRows } from "@/lib/derive";
import { currentMonthStart, formatPKR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({
    meta: [
      { title: "Budgets — PaisaFlow" },
      { name: "description", content: "Set monthly spending limits per category and track progress in PaisaFlow." },
      { property: "og:title", content: "Budgets — PaisaFlow" },
      { property: "og:description", content: "Set monthly spending limits per category and track progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const qc = useQueryClient();
  const month = currentMonthStart();
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState("");

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets", month],
    queryFn: () => listBudgets({ data: { month } }),
  });
  const { data: txs = [] } = useQuery({ queryKey: ["transactions", "all"], queryFn: () => listTransactions() });

  const rows = useMemo(() => budgetRows(budgets, categories, txs, month.slice(0, 7)), [budgets, categories, txs, month]);
  const totalLimit = rows.reduce((a, r) => a + r.limit, 0);
  const totalSpent = rows.reduce((a, r) => a + r.spent, 0);

  const save = useMutation({
    mutationFn: async () => {
      const n = Number(limit);
      if (!categoryId) throw new Error("Choose a category.");
      if (!n || n <= 0) throw new Error("Enter a monthly limit greater than zero.");
      await upsertBudget({ data: { category_id: categoryId, monthly_limit: n, month } });
    },
    onSuccess: () => {
      toast.success("Budget saved");
      setLimit("");
      setCategoryId("");
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteBudget({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });

  const monthName = new Date(`${month}T00:00:00`).toLocaleDateString("en-PK", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader title="Budgets" subtitle={`Monthly limits for ${monthName}`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total budget" value={formatPKR(totalLimit, { noDecimals: true })} />
        <StatCard label="Spent so far" tone="expense" value={formatPKR(totalSpent, { noDecimals: true })} delay={0.05} />
        <StatCard
          label="Remaining"
          tone={totalLimit - totalSpent >= 0 ? "income" : "expense"}
          value={formatPKR(totalLimit - totalSpent, { noDecimals: true })}
          delay={0.1}
        />
      </div>

      <SectionCard title="Set a budget">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-10 w-full rounded-lg bg-card">
              <SelectValue placeholder="Expense category" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((c) => c.kind === "expense")
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="Monthly limit (Rs)"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="h-10 rounded-lg"
          />
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save Budget"}
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="This month's progress">
        {rows.length === 0 ? (
          <EmptyState icon={<Wallet className="h-5 w-5" />} title="No budgets yet" hint="Pick a category above and set a monthly limit." />
        ) : (
          <ul className="space-y-5">
            {rows.map((r) => (
              <li key={r.budget.id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="inline-flex min-w-0 items-center gap-2 font-semibold">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.category.color }} />
                    <span className="truncate">{r.category.name}</span>
                    {r.pct > 100 ? <AlertTriangle className="h-4 w-4 shrink-0 text-expense" aria-label="Over budget" /> : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-sm tabular-nums">
                    <span className={r.pct > 100 ? "font-bold text-expense" : "text-muted-foreground"}>
                      {formatPKR(r.spent, { noDecimals: true })} / {formatPKR(r.limit, { noDecimals: true })}
                    </span>
                    <button
                      onClick={() => remove.mutate(r.budget.id)}
                      aria-label={`Delete ${r.category.name} budget`}
                      className="grid h-7 w-7 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
                <Progress value={Math.min(100, r.pct)} className={r.pct > 100 ? "h-2 [&>div]:bg-expense" : "h-2"} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
