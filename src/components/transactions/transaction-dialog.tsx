import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { addTransaction, listCategories, updateTransaction } from "@/lib/api";
import { todayISO } from "@/lib/format";
import type { Transaction, TxType } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Add / edit transaction dialog: income or expense, used across pages. */
export function TransactionDialog({
  open,
  onOpenChange,
  initial,
  defaultType = "expense",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Transaction | null;
  defaultType?: TxType;
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<TxType>(initial?.type ?? defaultType);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [date, setDate] = useState(initial?.occurred_on ?? todayISO());
  const [note, setNote] = useState(initial?.note ?? "");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });

  useEffect(() => {
    if (open) {
      setType(initial?.type ?? defaultType);
      setAmount(initial ? String(initial.amount) : "");
      setCategoryId(initial?.category_id ?? "");
      setDate(initial?.occurred_on ?? todayISO());
      setNote(initial?.note ?? "");
    }
  }, [open, initial, defaultType]);

  const options = categories.filter((c) => c.kind === type);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = Number(amount);
      if (!parsed || parsed <= 0) throw new Error("Enter an amount greater than zero.");
      if (!date) throw new Error("Pick a date for this transaction.");
      const payload = {
        type,
        amount: parsed,
        category_id: categoryId || null,
        occurred_on: date,
        note: note || null,
      };
      if (initial) await updateTransaction({ data: { id: initial.id, ...payload } });
      else await addTransaction({ data: payload });
    },
    onSuccess: () => {
      toast.success(initial ? "Transaction updated" : "Transaction added");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border bg-card shadow-lift sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">
            {initial ? "Edit transaction" : "Add transaction"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Record money in or out — it flows straight into your dashboard.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-muted p-1">
            {(["expense", "income"] as TxType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategoryId("");
                }}
                className={cn(
                  "cursor-pointer rounded-lg py-2 text-sm font-semibold capitalize transition-colors",
                  type === t
                    ? t === "income"
                      ? "bg-card text-income shadow-soft"
                      : "bg-card text-expense shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-amount">Amount (Rs)</Label>
            <Input
              id="tx-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1250.00"
              required
              className="h-10 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-10 w-full rounded-lg bg-card">
                <SelectValue placeholder={options.length ? "Choose a category" : "No categories yet"} />
              </SelectTrigger>
              <SelectContent>
                {options.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-date">Date</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-lg"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-note">Note (optional)</Label>
            <Textarea
              id="tx-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was this for?"
              className="min-h-16 rounded-lg"
            />
          </div>

          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : initial ? "Save Changes" : "Add Transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
