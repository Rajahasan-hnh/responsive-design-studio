import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addTransaction, deleteTransaction } from "@/lib/api";
import { todayISO } from "@/lib/format";
import type { Transaction } from "@/lib/types";

/** Delete with Undo, and Duplicate (copies to today). Updates the screen instantly. */
export function useTransactionActions() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["budgets"] });
  };
  const copy = (t: Transaction, occurred_on: string) =>
    addTransaction({
      data: { type: t.type, amount: Number(t.amount), category_id: t.category_id, occurred_on, note: t.note },
    });

  async function remove(t: Transaction) {
    // Optimistically drop the row from every cached transaction list.
    const snapshots = qc.getQueriesData<Transaction[]>({ queryKey: ["transactions"] });
    qc.setQueriesData<Transaction[]>({ queryKey: ["transactions"] }, (old) =>
      Array.isArray(old) ? old.filter((x) => x.id !== t.id) : old,
    );
    try {
      await deleteTransaction({ data: { id: t.id } });
      refresh();
      toast.success("Transaction deleted", {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await copy(t, t.occurred_on);
              refresh();
              toast.success("Restored");
            } catch {
              toast.error("Couldn't restore it. Please add it again.");
            }
          },
        },
      });
    } catch {
      snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error("Couldn't delete that. Please try again.");
    }
  }

  async function duplicate(t: Transaction) {
    const temp: Transaction = { ...t, id: `temp-${Date.now()}`, occurred_on: todayISO() };
    qc.setQueryData<Transaction[]>(["transactions", "all"], (old) => (old ? [temp, ...old] : old));
    try {
      await copy(t, todayISO());
      refresh();
      toast.success("Duplicated to today");
    } catch {
      refresh();
      toast.error("Couldn't duplicate that. Please try again.");
    }
  }

  return { remove, duplicate };
}
