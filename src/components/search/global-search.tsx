import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { listCategories, listTransactions } from "@/lib/api";
import { filterTransactions, parseQuery } from "@/lib/search";
import { formatDate, formatPKR, formatSigned } from "@/lib/format";

const EXAMPLES = [
  "Food expenses this month",
  "Travel expenses last week",
  "Salary transactions",
  "Purchases above 5000",
];

/** Global natural-language transaction search. Opens with Ctrl/⌘+K or "/". */
export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA")) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  const { data: txs = [] } = useQuery({ queryKey: ["transactions", "all"], queryFn: () => listTransactions(), enabled: open });
  const { data: cats = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories(), enabled: open });
  const byId = useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats]);

  const results = useMemo(
    () => (q.trim() ? filterTransactions(txs, cats, parseQuery(q)).slice(0, 50) : []),
    [q, txs, cats],
  );
  const total = results.reduce((s, t) => s + (t.type === "income" ? 1 : -1) * Number(t.amount), 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Try “food expenses this month”" value={q} onValueChange={setQ} />
      <CommandList className="max-h-[60vh]">
        {!q.trim() ? (
          <CommandGroup heading="Try asking">
            {EXAMPLES.map((ex) => (
              <CommandItem key={ex} value={ex} onSelect={() => setQ(ex)} className="cursor-pointer">
                {ex}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          <>
            <CommandEmpty>No matching transactions. Try a different word or date.</CommandEmpty>
            {results.length > 0 && (
              <CommandGroup heading={`${results.length} found · net ${formatPKR(total)}`}>
                {results.map((t) => {
                  const c = byId.get(t.category_id ?? "");
                  return (
                    <CommandItem
                      key={t.id}
                      value={`${t.id} ${q}`}
                      onSelect={() => {
                        onOpenChange(false);
                        navigate({ to: "/calendar", search: { date: t.occurred_on } });
                      }}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c?.color ?? "#7a8aa0" }} />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-semibold">{c?.name ?? "Uncategorized"}</span>
                        <span className="text-muted-foreground"> · {formatDate(t.occurred_on)}{t.note ? ` · ${t.note}` : ""}</span>
                      </span>
                      <span className={`shrink-0 font-bold tabular-nums ${t.type === "income" ? "text-income" : "text-expense"}`}>
                        {formatSigned(Number(t.amount), t.type)}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
