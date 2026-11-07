import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/page";
import { listCategories, listTransactions } from "@/lib/api";
import { categoryBreakdown, sumOf } from "@/lib/derive";
import { currentMonthStart, formatDate, formatPKR, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — PaisaFlow" },
      { name: "description", content: "Generate income and expense reports for any date range in PaisaFlow." },
      { property: "og:title", content: "Reports — PaisaFlow" },
      { property: "og:description", content: "Generate income and expense reports for any date range." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [from, setFrom] = useState(currentMonthStart());
  const [to, setTo] = useState(todayISO());
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const { data: txs = [], isFetching } = useQuery({
    queryKey: ["transactions", "report", range],
    queryFn: () => listTransactions({ data: range! }),
    enabled: !!range,
  });

  const income = sumOf(txs, "income");
  const expense = sumOf(txs, "expense");
  const expenseCats = categoryBreakdown(txs, categories, "expense");
  const incomeCats = categoryBreakdown(txs, categories, "income");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Summaries for any period, ready to print."
        actions={
          range ? (
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          ) : null
        }
      />

      <SectionCard title="Report period">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (from > to) return;
            setRange({ from, to });
          }}
          className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div className="space-y-1.5">
            <Label htmlFor="r-from">From</Label>
            <Input id="r-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-to">To</Label>
            <Input id="r-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-lg" />
          </div>
          <Button type="submit" disabled={isFetching}>
            {isFetching ? "Generating…" : "Generate Report"}
          </Button>
        </form>
      </SectionCard>

      {!range ? (
        <EmptyState icon={<FileText className="h-5 w-5" />} title="Pick a period" hint="Choose dates and press Generate Report." />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {formatDate(range.from)} – {formatDate(range.to)} · {txs.length} transactions
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Income" tone="income" value={formatPKR(income)} />
            <StatCard label="Expenses" tone="expense" value={formatPKR(expense)} delay={0.05} />
            <StatCard label="Net" tone={income - expense >= 0 ? "income" : "expense"} value={formatPKR(income - expense)} delay={0.1} />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <BreakdownTable title="Expenses by category" rows={expenseCats} total={expense} />
            <BreakdownTable title="Income by category" rows={incomeCats} total={income} />
          </div>
        </>
      )}
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { name: string; value: number; color: string }[];
  total: number;
}) {
  return (
    <SectionCard title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing recorded in this period.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="inline-flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="truncate">{r.name}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="font-bold">{formatPKR(r.value)}</span>
                <span className="ml-2 text-muted-foreground">{total > 0 ? Math.round((r.value / total) * 100) : 0}%</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
