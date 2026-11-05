import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, PiggyBank, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useHydrated } from "@tanstack/react-router";
import { getProfile, listBudgets, listCategories, listTransactions } from "@/lib/api";
import { CountUp } from "@/components/count-up";
import { ChartGate, EmptyState, PageHeader, SectionCard, StatCard } from "@/components/page";
import { SeeAllLink, TransactionList } from "@/components/transactions/transaction-list";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import {
  balanceOf,
  budgetRows,
  categoryBreakdown,
  monthlySeries,
  sumOf,
} from "@/lib/derive";
import {
  currentMonthStart,
  firstNameOf,
  formatMonthLabel,
  formatPKR,
  greetingForHour,
  monthStartOffset,
  todayISO,
} from "@/lib/format";
import type { Transaction } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PaisaFlow" },
      {
        name: "description",
        content: "Your PaisaFlow overview: balance, monthly income and expenses, budgets and recent transactions.",
      },
      { property: "og:title", content: "Dashboard — PaisaFlow" },
      {
        property: "og:description",
        content: "Your PaisaFlow overview: balance, income, expenses, budgets and recent transactions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const hydrated = useHydrated();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"income" | "expense">("expense");

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", "all"],
    queryFn: () => listTransactions(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });
  const thisMonth = currentMonthStart();
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets", thisMonth],
    queryFn: () => listBudgets({ data: { month: thisMonth } }),
  });

  const monthKey = todayISO().slice(0, 7);
  const series = useMemo(() => monthlySeries(transactions, 6), [transactions]);
  const breakdown = useMemo(
    () => categoryBreakdown(transactions, categories, "expense", monthKey),
    [transactions, categories, monthKey],
  );
  const monthIncome = sumOf(transactions, "income", [monthKey]);
  const monthExpense = sumOf(transactions, "expense", [monthKey]);
  const balance = balanceOf(transactions);

  const totalBudget = budgets.reduce((acc, b) => acc + Number(b.monthly_limit), 0);
  const budgetUsedPct = totalBudget > 0 ? Math.round((monthExpense / totalBudget) * 100) : 0;

  const rows = useMemo(
    () => budgetRows(budgets, categories, transactions, monthKey),
    [budgets, categories, transactions, monthKey],
  );
  const overBudget = rows.filter((r) => r.pct > 100).length;

  const recent = transactions.slice(0, 6);

  const greeting = hydrated ? greetingForHour(new Date().getHours()) : "Hello";
  const firstName = firstNameOf(profile?.full_name ?? "");
  const today = hydrated
    ? new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${firstName}!`}
        subtitle={today ? `Here's how your money is flowing · ${today}` : "Here's how your money is flowing"}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Balance"
          value={<CountUp value={balance} format={(v) => formatPKR(v)} />}
          sub={balance >= 0 ? "Across all activity" : "Spending exceeds income"}
          delay={0}
        />
        <StatCard
          label="Monthly Income"
          tone="income"
          value={<CountUp value={monthIncome} format={(v) => formatPKR(v)} />}
          sub="This month"
          delay={0.05}
        />
        <StatCard
          label="Monthly Expenses"
          tone="expense"
          value={<CountUp value={monthExpense} format={(v) => formatPKR(v)} />}
          sub="This month"
          delay={0.1}
        />
        <StatCard
          label="Budget Used"
          value={
            totalBudget > 0 ? (
              <CountUp value={budgetUsedPct} format={(v) => `${Math.round(v)}%`} />
            ) : (
              "—"
            )
          }
          sub={
            totalBudget > 0
              ? overBudget > 0
                ? `${overBudget} categor${overBudget === 1 ? "y" : "ies"} over budget`
                : `${formatPKR(monthExpense, { noDecimals: true })} of ${formatPKR(totalBudget, { noDecimals: true })}`
              : "No budgets set yet"
          }
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionCard title="Cash Flow Overview" className="xl:col-span-2" delay={0.1}>
          <ChartGate height={280}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={series} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontStyle: "italic" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontStyle: "italic" }}
                  tickFormatter={(v: number) => formatPKR(v, { compact: true, noDecimals: true })}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontStyle: "italic",
                    fontSize: 13,
                  }}
                  formatter={(value: number | string, name: string) => [
                    formatPKR(Number(value)),
                    name === "income" ? "Income" : "Expenses",
                  ]}
                />
                <Bar dataKey="income" fill="var(--income)" radius={[6, 6, 0, 0]} maxBarSize={26} />
                <Bar dataKey="expense" fill="var(--expense)" radius={[6, 6, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </ChartGate>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-income" /> Income
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-expense" /> Expenses
            </span>
          </div>
        </SectionCard>

        <SectionCard title="Spending Breakdown" delay={0.15}>
          {breakdown.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-5 w-5" />}
              title="No expenses this month"
              hint="Add your first expense to see the breakdown."
            />
          ) : (
            <>
              <ChartGate height={200}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={breakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {breakdown.map((slice) => (
                        <Cell key={slice.name} fill={slice.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontStyle: "italic",
                        fontSize: 13,
                      }}
                      formatter={(value: number | string, name: string) => [formatPKR(Number(value)), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartGate>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {breakdown.slice(0, 6).map((slice) => {
                  const pct = monthExpense > 0 ? Math.round((slice.value / monthExpense) * 100) : 0;
                  return (
                    <li key={slice.name} className="flex items-center justify-between gap-2 text-sm">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                        <span className="truncate text-muted-foreground">{slice.name}</span>
                      </span>
                      <span className="shrink-0 font-bold tabular-nums text-foreground">{pct}%</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionCard
          title="Recent Transactions"
          className="xl:col-span-2"
          delay={0.2}
          action={<SeeAllLink to="/expenses" label="See all" />}
        >
          {isLoading ? (
            <div className="space-y-3 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                  <div className="ml-auto h-3 w-16 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <TransactionList
              transactions={recent}
              categories={categories}
              onEdit={() => undefined}
              onDelete={() => undefined}
              emptyState={
                <EmptyState
                  icon={<Wallet className="h-5 w-5" />}
                  title="No transactions yet"
                  hint="Record your first income or expense to get started."
                  action={
                    <Link
                      to="/expenses"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      Add one <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  }
                />
              }
            />
          )}
        </SectionCard>

        <SectionCard title="Quick Actions" delay={0.25}>
          <div className="space-y-3">
            <button
              onClick={() => {
                setDialogType("expense");
                setDialogOpen(true);
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-expense/40 hover:shadow-soft active:scale-[0.98]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-expense/10 text-expense">
                <TrendingDown className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-foreground">Add Expense</span>
                <span className="block text-xs text-muted-foreground">Log money going out</span>
              </span>
            </button>
            <button
              onClick={() => {
                setDialogType("income");
                setDialogOpen(true);
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-income/40 hover:shadow-soft active:scale-[0.98]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-income/10 text-income">
                <TrendingUp className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-foreground">Add Income</span>
                <span className="block text-xs text-muted-foreground">Log money coming in</span>
              </span>
            </button>
            <Link
              to="/budgets"
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-soft active:scale-[0.98]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <PiggyBank className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-foreground">Manage Budgets</span>
                <span className="block text-xs text-muted-foreground">Set monthly limits</span>
              </span>
            </Link>
            <Link
              to="/savings"
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-soft active:scale-[0.98]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-foreground">Savings Goals</span>
                <span className="block text-xs text-muted-foreground">Grow your money</span>
              </span>
            </Link>
          </div>
        </SectionCard>
      </div>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} defaultType={dialogType} />
    </div>
  );
}
