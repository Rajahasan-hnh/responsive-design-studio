import type { Category, Transaction, TxType } from "@/lib/types";

/** Parsed natural-language transaction query. Pure and testable. */
export interface ParsedQuery {
  type?: TxType;
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  terms: string[];
}

function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const STOP = new Set([
  "transactions", "transaction", "entries", "entry", "in", "on", "for", "the", "a", "an",
  "of", "my", "all", "show", "me", "rs", "pkr", "purchases", "purchase", "spent", "with",
]);

export function parseQuery(raw: string, now: Date = new Date()): ParsedQuery {
  let q = ` ${raw.toLowerCase().replace(/,/g, "")} `;
  const out: ParsedQuery = { terms: [] };

  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) => {
    const m = q.match(re);
    if (m) {
      fn(m);
      q = q.replace(re, " ");
    }
  };

  take(/\b(above|over|more than|greater than|>)\s*(?:rs\.?\s*)?(\d+(?:\.\d+)?)(k)?/, (m) => {
    out.minAmount = Number(m[2]) * (m[3] ? 1000 : 1);
  });
  take(/\b(below|under|less than|<)\s*(?:rs\.?\s*)?(\d+(?:\.\d+)?)(k)?/, (m) => {
    out.maxAmount = Number(m[2]) * (m[3] ? 1000 : 1);
  });

  const y = now.getFullYear();
  const mo = now.getMonth();
  take(/\bthis month\b/, () => {
    out.from = iso(new Date(y, mo, 1));
    out.to = iso(new Date(y, mo + 1, 0));
  });
  take(/\blast month\b/, () => {
    out.from = iso(new Date(y, mo - 1, 1));
    out.to = iso(new Date(y, mo, 0));
  });
  take(/\bthis week\b/, () => {
    const dow = (now.getDay() + 6) % 7; // Monday start
    out.from = iso(new Date(y, mo, now.getDate() - dow));
    out.to = iso(new Date(y, mo, now.getDate() - dow + 6));
  });
  take(/\blast week\b/, () => {
    const dow = (now.getDay() + 6) % 7;
    out.from = iso(new Date(y, mo, now.getDate() - dow - 7));
    out.to = iso(new Date(y, mo, now.getDate() - dow - 1));
  });
  take(/\btoday\b/, () => {
    out.from = out.to = iso(now);
  });
  take(/\byesterday\b/, () => {
    out.from = out.to = iso(new Date(y, mo, now.getDate() - 1));
  });
  take(/\bthis year\b/, () => {
    out.from = `${y}-01-01`;
    out.to = `${y}-12-31`;
  });

  take(/\b(expenses?|spending)\b/, () => (out.type = "expense"));
  take(/\b(income|earnings?)\b/, () => (out.type = "income"));

  out.terms = q.split(/\s+/).filter((w) => w && !STOP.has(w));
  return out;
}

// Common synonyms so "travel" finds "Transport" etc.
const SYNONYMS: Record<string, string[]> = {
  travel: ["transport", "travel", "fuel", "taxi"],
  food: ["food", "dining", "grocer", "restaurant"],
  salary: ["salary", "pay"],
};

export function filterTransactions(
  txs: Transaction[],
  categories: Category[],
  p: ParsedQuery,
): Transaction[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return txs.filter((t) => {
    if (p.type && t.type !== p.type) return false;
    if (p.from && t.occurred_on < p.from) return false;
    if (p.to && t.occurred_on > p.to) return false;
    const amt = Number(t.amount);
    if (p.minAmount !== undefined && amt <= p.minAmount) return false;
    if (p.maxAmount !== undefined && amt >= p.maxAmount) return false;
    if (p.terms.length) {
      const hay = `${byId.get(t.category_id ?? "")?.name ?? ""} ${t.note ?? ""}`.toLowerCase();
      return p.terms.every((term) =>
        (SYNONYMS[term] ?? [term]).some((s) => hay.includes(s)),
      );
    }
    return true;
  });
}
