import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatSigned } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

/** Shared transaction row list with inline edit/delete. */
export function TransactionList({
  transactions,
  categories,
  onEdit,
  onDelete,
  emptyState,
}: {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  emptyState?: React.ReactNode;
}) {
  const byId = new Map(categories.map((c) => [c.id, c]));

  if (transactions.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <ul className="divide-y divide-border">
      {transactions.map((t) => {
        const category = t.category_id ? byId.get(t.category_id) : undefined;
        return (
          <li
            key={t.id}
            className="group flex items-center gap-3 py-3 transition-colors sm:gap-4"
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
              style={{ backgroundColor: category?.color ?? "#7a8aa0" }}
              aria-hidden
            >
              {(category?.name ?? "?").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {category?.name ?? "Uncategorized"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {formatDate(t.occurred_on)}
                {t.note ? ` · ${t.note}` : ""}
              </p>
            </div>
            <p
              className={`shrink-0 text-sm font-bold tabular-nums ${
                t.type === "income" ? "text-income" : "text-expense"
              }`}
            >
              {formatSigned(Number(t.amount), t.type)}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label={`Actions for ${category?.name ?? "transaction"}`}
                  className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(t)} className="cursor-pointer">
                  <Pencil className="h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(t)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        );
      })}
    </ul>
  );
}

export function SeeAllLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="text-sm font-semibold text-primary transition-colors hover:underline"
    >
      {label}
    </Link>
  );
}
