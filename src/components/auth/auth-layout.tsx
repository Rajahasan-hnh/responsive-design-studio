import * as React from "react";
import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { Input as InputRaw } from "@/components/ui/input";
import { Label as LabelRaw } from "@/components/ui/label";

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

        {footer ? (
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export function AuthField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <LabelRaw htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </LabelRaw>
      {children}
    </div>
  );
}

export const AuthInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof InputRaw>
>(({ className, ...props }, ref) => (
  <InputRaw
    ref={ref}
    className={`h-10 rounded-lg border-input bg-card ${className ?? ""}`}
    {...props}
  />
));
AuthInput.displayName = "AuthInput";

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <AuthInput
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 grid w-10 cursor-pointer place-items-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/** Friendly error copy for auth failures. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password. Please try again.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("email not confirmed"))
    return "Please check your inbox and click the confirmation link first.";
  if (m.includes("password should be at least"))
    return "Passwords must be at least 6 characters long.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "That email address doesn't look right. Please check it.";
  return message || "Something went wrong. Please try again.";
}
