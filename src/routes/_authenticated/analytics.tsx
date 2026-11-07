import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from "react";
import { CountUp } from "@/components/count-up";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { listBudgets, listCategories, listTransactions } from "@/lib/api";
import { ChartGate, EmptyState, PageHeader, SectionCard, StatCard } from "@/components/page";
import { categoryBreakdown, monthlySeries, sumOf } from "@/lib/derive";
import { currentMonthStart, formatMonthLabel, formatPKR, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — PaisaFlow" },
      {
        name: "description",
        content: "Understand your spending patterns with PaisaFlow analytics: trends, categories and savings rate.",
      },
      { property: "og:title", content: "Analytics — PaisaFlow" },
      {
        property: "og:description",
        content: "Understand your spending patterns with PaisaFlow analytics: trends, categories and savings rate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsPage,
});

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontStyle: "italic",
  fontSize: 13,
} as const;

function AnalyticsPage() {
  const [month, setMonth] = useState(todayISO().slice(0, 7));

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", "all"],
    queryFn: () => listTransactions(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });
  const currentMonth = currentMonthStart();
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets", currentMonth],
    queryFn: () => listBudgets({ data: { month: currentMonth } }),
  });

  const series = useMemo(() => monthlySeries(transactions, 6), [transactions]);
  const breakdown = useMemo(
    () => categoryBreakdown(transactions, categories, "expense", month),
    [transactions, categories, month],
  );
  const incomeBreakdown = useMemo(
    () => categoryBreakdown(transactions, categories, "income", month),
    [transactions, categories, month],
  );

  const monthIncome = sumOf(transactions, "income", [month]);
  const monthExpense = sumOf(transactions, "expense", [month]);
  const savingsRate = monthIncome > 0 ? Math.max(0, Math.round(((monthIncome - monthExpense) / monthIncome) * 100)) : 0;

  const avgDailyExpense = useMemo(() => {
    const inMonth = transactions.filter(
      (t) => t.type === "expense" && t.occurred_on.slice(0, 7) === month,
    );
    const now = new Date();
    const isCurrentMonth = month === now.toISOString().slice(0, 7);
    const days = isCurrentMonth ? now.getDate() : new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
    if (inMonth.length === 0 || days === 0) return 0;
    return inMonth.reduce((acc, t) => acc + Number(t.amount), 0) / days;
  }, [transactions, month]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>([todayISO().slice(0, 7)]);
    for (const t of transactions) set.add(t.occurred_on.slice(0, 7));
    return [...set].sort().reverse();
  }, [transactions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Where your money went, month by month."
        actions={
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Month"
            className="h-10 cursor-pointer rounded-lg border border-input bg-card px-3 text-sm shadow-soft"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {new Date(`${m}-01T00:00:00`).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
              </option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Income (selected month)" tone="income" value={formatPKR(monthIncome, { noDecimals: true })} />
        <StatCard label="Expenses (selected month)" tone="expense" value={formatPKR(monthExpense, { noDecimals: true })} delay={0.05} />
        <StatCard
          label="Savings rate"
          value={monthIncome > 0 ? `${savingsRate}%` : "—"}
          sub={monthIncome > 0 ? "Of income kept this month" : "No income recorded"}
          delay={0.1}
        />
      </div>

      <SectionCard title="Income vs Expenses — last 6 months">
        <ChartGate height={300}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={series}>
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
                width={52}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontStyle: "italic" }}
                tickFormatter={(v: number) => formatPKR(v, { compact: true, noDecimals: true })}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string, n: string) => [formatPKR(Number(v)), n === "income" ? "Income" : "Expenses"]} />
              <Legend
                formatter={(value: string) => (value === "income" ? "Income" : "Expenses")}
                iconType="circle"
              />
              <Line type="monotone" dataKey="income" stroke="var(--income)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expense" stroke="var(--expense)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartGate>
      </SectionCard>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title={`Expense breakdown — ${formatMonthLabel(`${month}-01`)} ${month.slice(0, 4)}`}>
          {breakdown.length === 0 ? (
            <EmptyState icon={<BarChart3 className="h-5 w-5" />} title="No expenses this month" />
          ) : (
            <>
              <ChartGate height={260}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={breakdown} dataKey="value" nameKey="name" outerRadius={95} strokeWidth={0}>
                      {breakdown.map((s) => (
                        <Cell key={s.name} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string, n: string) => [formatPKR(Number(v)), n]} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartGate>
              <ul className="mt-2 space-y-2">
                {breakdown.slice(0, 5).map((s) => (
                  <li key={s.name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="truncate text-muted-foreground">{s.name}</span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">{formatPKR(s.value, { noDecimals: true })}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>

        <SectionCard title={`Income sources — ${formatMonthLabel(`${month}-01`)} ${month.slice(0, 4)}`}>
          {incomeBreakdown.length === 0 ? (
            <EmptyState icon={<BarChart3 className="h-5 w-5" />} title="No income this month" />
          ) : (
            <>
              <ChartGate height={260}>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--income)" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="var(--income)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontStyle: "italic" }} />
                    <YAxis tickLine={false} axisLine={false} width={52} tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontStyle: "italic" }} tickFormatter={(v: number) => formatPKR(v, { compact: true, noDecimals: true })} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string) => formatPKR(Number(v))} />
                    <Area type="monotone" dataKey="income" stroke="var(--income)" strokeWidth={2.5} fill="url(#incomeFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartGate>
              <ul className="mt-2 space-y-2">
                {incomeBreakdown.slice(0, 5).map((s) => (
                  <li key={s.name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="truncate text-muted-foreground">{s.name}</span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">{formatPKR(s.value, { noDecimals: true })}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Average daily spend (selected month)"
          tone="expense"
          value={<CountUp value={avgDailyExpense} format={(v) => formatPKR(v)} />}
          sub={avgDailyExpense > 0 ? "Per day, on average" : "No expenses recorded"}
        />
        <StatCard
          label="Budgets in place"
          value={budgets.length > 0 ? `${budgets.length}` : "—"}
          sub={budgets.length > 0 ? "Categories with a monthly limit" : "Set budgets on the Budgets page"}
          delay={0.05}
        />
      </div>
    </div>
  );
}

