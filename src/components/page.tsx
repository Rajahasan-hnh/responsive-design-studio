import type { ReactNode } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Page title header with optional action area. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** White card with soft shadow used for every section. */
export function SectionCard({
  title,
  action,
  children,
  className,
  delay = 0,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6",
        className,
      )}
    >
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title ? <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2> : null}
          {action}
        </div>
      ) : null}
      {children}
    </motion.section>
  );
}

/** Financial overview stat card. */
export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "income" | "expense";
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="card-hover rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 truncate text-2xl font-bold tracking-tight sm:text-[1.7rem]",
          tone === "income" && "text-income",
          tone === "expense" && "text-expense",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-2 text-xs text-muted-foreground">{sub}</p> : null}
    </motion.div>
  );
}

/** Charts render client-only; skeletons show until hydration. */
export function ChartGate({
  children,
  height = 260,
}: {
  children: ReactNode;
  height?: number;
}) {
  return (
    <ClientOnly
      fallback={
        <div
          className="w-full animate-pulse rounded-xl bg-muted"
          style={{ height }}
          aria-hidden
        />
      }
    >
      {children}
    </ClientOnly>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-card text-muted-foreground shadow-soft">
        {icon}
      </span>
      <p className="mt-3 font-semibold text-foreground">{title}</p>
      {hint ? <p className="mt-1 max-w-xs text-sm text-muted-foreground">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
