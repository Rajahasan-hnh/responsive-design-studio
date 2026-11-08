import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionCard } from "@/components/page";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { useTransactionActions } from "@/components/transactions/use-transaction-actions";
import { listCategories, listTransactions } from "@/lib/api";
import { formatDate, formatPKR, todayISO } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  validateSearch: (s: Record<string, unknown>): { date?: string } =>
    typeof s.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? { date: s.date } : {},
  head: () => ({
    meta: [
      { title: "Calendar — PaisaFlow" },
      { name: "description", content: "See your daily income and spending on a monthly calendar." },
      { property: "og:title", content: "Calendar — PaisaFlow" },
      { property: "og:description", content: "See your daily income and spending on a monthly calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => String(n).padStart(2, "0");

function CalendarPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/calendar" });
  const selected = search.date ?? todayISO();
  const [cursor, setCursor] = useState(() => selected.slice(0, 7));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const { remove, duplicate } = useTransactionActions();

  const { data: txs = [], isLoading } = useQuery({ queryKey: ["transactions", "all"], queryFn: () => listTransactions() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const byDay = useMemo(() => {
    const m = new Map<string, { inc: number; exp: number; list: Transaction[] }>();
    for (const t of txs) {
      const e = m.get(t.occurred_on) ?? { inc: 0, exp: 0, list: [] };
      if (t.type === "income") e.inc += Number(t.amount);
      else e.exp += Number(t.amount);
      e.list.push(t);
      m.set(t.occurred_on, e);
    }
    return m;
  }, [txs]);

  const [yy, mm] = cursor.split("-").map(Number) as [number, number];
  const first = new Date(yy, mm - 1, 1);
  const daysInMonth = new Date(yy, mm, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${cursor}-${pad(i + 1)}`),
  ];
  const monthTotals = cells.reduce(
    (a, d) => {
      const e = d ? byDay.get(d) : undefined;
      return e ? { inc: a.inc + e.inc, exp: a.exp + e.exp } : a;
    },
    { inc: 0, exp: 0 },
  );

  const shift = (n: number) => {
    const d = new Date(yy, mm - 1 + n, 1);
    setCursor(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };
  const pick = (d: string) => navigate({ search: { date: d }, replace: true });
  const day = byDay.get(selected);
  const today = todayISO();

  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" subtitle="Tap any day to see what came in and went out." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <SectionCard
          title={first.toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
          action={
            <div className="flex gap-1">
              <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => shift(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" aria-label="Next month" onClick={() => shift(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        >
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
            <span className="text-income">In {formatPKR(monthTotals.inc, { noDecimals: true })}</span>
            <span className="text-expense">Out {formatPKR(monthTotals.exp, { noDecimals: true })}</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">{w}</div>
            ))}
          </div>
          <motion.div
            key={cursor}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-7 gap-1"
          >
            {cells.map((d, i) => {
              if (!d) return <div key={`e${i}`} />;
              const e = byDay.get(d);
              const isSel = d === selected;
              return (
                <button
                  key={d}
                  onClick={() => pick(d)}
                  aria-label={`${formatDate(d)}${e ? `, ${e.list.length} transactions` : ""}`}
                  aria-pressed={isSel}
                  className={cn(
                    "flex aspect-square min-h-11 cursor-pointer flex-col items-center justify-start gap-0.5 rounded-lg border p-1 text-xs transition-all hover:border-primary/40 sm:aspect-auto sm:h-20 sm:items-start sm:p-2",
                    isSel ? "border-primary bg-primary text-primary-foreground shadow-button" : "border-border bg-card",
                    d === today && !isSel && "border-primary/60",
                  )}
                >
                  <span className="font-bold">{Number(d.slice(8))}</span>
                  {e && (
                    <>
                      <span className="flex gap-0.5 sm:hidden">
                        {e.inc > 0 && <span className="h-1.5 w-1.5 rounded-full bg-income" />}
                        {e.exp > 0 && <span className="h-1.5 w-1.5 rounded-full bg-expense" />}
                      </span>
                      <span className="hidden w-full text-left text-[10px] leading-tight sm:block">
                        {e.inc > 0 && <span className={cn("block truncate", !isSel && "text-income")}>+{formatPKR(e.inc, { compact: true })}</span>}
                        {e.exp > 0 && <span className={cn("block truncate", !isSel && "text-expense")}>−{formatPKR(e.exp, { compact: true })}</span>}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </motion.div>
        </SectionCard>

        <SectionCard title={formatDate(selected)} delay={0.05}>
          {day && (
            <div className="mb-2 flex gap-4 text-sm font-semibold">
              <span className="text-income">+{formatPKR(day.inc)}</span>
              <span className="text-expense">−{formatPKR(day.exp)}</span>
            </div>
          )}
          {isLoading ? (
            <div className="space-y-3 py-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : (
            <TransactionList
              transactions={day?.list ?? []}
              categories={categories}
              onEdit={(t) => {
                setEditing(t);
                setDialogOpen(true);
              }}
              onDelete={remove}
              onDuplicate={duplicate}
              emptyState={
                <EmptyState
                  icon={<CalendarDays className="h-5 w-5" />}
                  title="Nothing on this day"
                  hint="Pick another date or add a transaction."
                />
              }
            />
          )}
        </SectionCard>
      </div>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} />
    </div>
  );
}
