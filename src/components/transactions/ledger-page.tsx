import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/page";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { CountUp } from "@/components/count-up";
import { useTransactionActions } from "@/components/transactions/use-transaction-actions";
import { listCategories, listTransactions } from "@/lib/api";
import { formatPKR, monthEndOffset, monthStartOffset, currentMonthStart } from "@/lib/format";
import type { Transaction, TxType } from "@/lib/types";

const RANGES = [
  { value: "this", label: "This month" },
  { value: "3m", label: "Last 3 months" },
  { value: "all", label: "All time" },
] as const;

type Range = (typeof RANGES)[number]["value"];

/** Shared ledger view used by the Income and Expenses pages. */
export function LedgerPage({ type }: { type: TxType }) {
  const [range, setRange] = useState<Range>("this");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", "all"],
    queryFn: () => listTransactions(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });

  const filtered = useMemo(() => {
    let from: string | null = null;
    let to: string | null = null;
    if (range === "this") {
      from = currentMonthStart();
      to = monthEndOffset(0);
    } else if (range === "3m") {
      from = monthStartOffset(2);
      to = monthEndOffset(0);
    }
    return transactions.filter((t) => {
      if (t.type !== type) return false;
      if (from && t.occurred_on < from) return false;
      if (to && t.occurred_on > to) return false;
      return true;
    });
  }, [transactions, type, range]);

  const total = filtered.reduce((acc, t) => acc + Number(t.amount), 0);

  const { remove: removeTx, duplicate } = useTransactionActions();

  const noun = type === "income" ? "Income" : "Expense";
  const plural = type === "income" ? "income entries" : "expenses";

  return (
    <div className="space-y-6">
      <PageHeader
        title={noun}
        subtitle={
          type === "income"
            ? "Every rupee that came in, in one clean list."
            : "Every rupee that went out, in one clean list."
        }
        actions={
          <>
            <Select value={range} onValueChange={(v) => setRange(v as Range)}>
              <SelectTrigger className="h-10 w-36 rounded-lg bg-card shadow-soft" aria-label="Date range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add {noun}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label={range === "this" ? "This month's total" : range === "3m" ? "Last 3 months' total" : "All-time total"}
          tone={type}
          value={<CountUp value={total} format={(v) => formatPKR(v)} />}
          sub={`${filtered.length} ${plural}`}
        />
        <StatCard
          label="Average per entry"
          value={
            filtered.length > 0 ? (
              <CountUp value={total / filtered.length} format={(v) => formatPKR(v)} />
            ) : (
              "—"
            )
          }
          sub={filtered.length > 0 ? `Across ${filtered.length} ${plural}` : "No entries in range"}
          delay={0.05}
        />
      </div>

      <SectionCard title={`${noun} entries`}>
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                <div className="ml-auto h-3 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <TransactionList
            transactions={filtered}
            categories={categories}
            onEdit={(t) => {
              setEditing(t);
              setDialogOpen(true);
            }}
            onDelete={removeTx}
            onDuplicate={duplicate}
            emptyState={
              <EmptyState
                icon={<Plus className="h-5 w-5" />}
                title={`No ${plural} in this range`}
                hint="Try a wider date range, or add your first entry."
                action={
                  <Button
                    onClick={() => {
                      setEditing(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add {noun}
                  </Button>
                }
              />
            }
          />
        )}
      </SectionCard>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        defaultType={type}
      />
    </div>
  );
}
