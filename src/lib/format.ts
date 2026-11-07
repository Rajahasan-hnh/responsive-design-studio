/** Shared money, date and greeting helpers (client + server safe, pure). */

export const CURRENCY = "PKR";

/** Rs 12,450.00 — PKR formatting with thousands separators. */
export function formatPKR(amount: number, opts?: { compact?: boolean; noDecimals?: boolean }) {
  const abs = Math.abs(amount);
  if (opts?.compact && abs >= 1000) {
    if (abs >= 100000) return `Rs ${(amount / 100000).toFixed(1)}L`;
    return `Rs ${(amount / 1000).toFixed(1)}k`;
  }
  return `Rs ${amount.toLocaleString("en-PK", {
    minimumFractionDigits: opts?.noDecimals ? 0 : 2,
    maximumFractionDigits: opts?.noDecimals ? 0 : 2,
  })}`;
}

/** Signed display for a transaction: -Rs 1,200.00 / +Rs 45,000.00 */
export function formatSigned(amount: number, type: "income" | "expense") {
  const sign = type === "income" ? "+" : "−";
  return `${sign}Rs ${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** First day of the current month as YYYY-MM-01 (client local time). */
export function currentMonthStart(): string {
  return `${todayISO().slice(0, 7)}-01`;
}

export function monthStartOffset(monthsAgo: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function monthEndOffset(monthsAgo: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

export function formatMonthLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-PK", { month: "short" });
}

export type Greeting = "Good morning" | "Good afternoon" | "Good evening";

export function greetingForHour(hour: number): Greeting {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function firstNameOf(fullName: string): string {
  const name = fullName.trim();
  if (!name) return "friend";
  return name.split(/\s+/)[0] ?? name;
}
