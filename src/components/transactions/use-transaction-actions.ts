import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addTransaction, deleteTransaction } from "@/lib/api";
import { todayISO } from "@/lib/format";
import type { Transaction } from "@/lib/types";

/** Delete with Undo, and Duplicate (copies to today). */
export function useTransactionActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["transactions"] });
  const copy = (t: Transaction, occurred_on: string) =>
    addTransaction({
      data: { type: t.type, amount: Number(t.amount), category_id: t.category_id, occurred_on, note: t.note },
    });

  async function remove(t: Transaction) {
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
      toast.error("Couldn't delete that. Please try again.");
    }
  }

  async function duplicate(t: Transaction) {
    try {
      await copy(t, todayISO());
      refresh();
      toast.success("Duplicated to today");
    } catch {
      toast.error("Couldn't duplicate that. Please try again.");
    }
  }

  return { remove, duplicate };
}
