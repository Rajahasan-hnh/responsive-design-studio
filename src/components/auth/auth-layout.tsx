import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Wallet } from "lucide-react";

/** Shared premium shell for all authentication screens. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/dashboard"
          className="mb-8 flex items-center justify-center gap-2.5"
          aria-label="PaisaFlow home"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-button">
            <Wallet className="h-5 w-5" />
          </span>
          <span className="text-2xl font-bold tracking-tight text-foreground">PaisaFlow</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="pr-10"
          required
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

import { useState as React_useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function Label(props: React.ComponentProps<typeof LabelRaw>) {
  return <LabelRaw className="text-sm font-medium text-foreground" {...props} />;
}
import { Label as LabelRaw } from "@/components/ui/label";
import { Input as InputRaw } from "@/components/ui/input";

function Input(props: React.ComponentProps<typeof InputRaw>) {
  return <InputRaw className="h-10 rounded-lg border-input bg-card" {...props} />;
}

export const AuthInput = Input;
export const AuthLabel = Label;

// keep React referenced for types
export const useToggle = () => {
  const [on, setOn] = React_useState(false);
  return { on, toggle: () => setOn((v) => !v) };
};
