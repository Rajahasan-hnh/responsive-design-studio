import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AuthField,
  AuthInput,
  AuthLayout,
  PasswordInput,
  friendlyAuthError,
} from "@/components/auth/auth-layout";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({
    meta: [
      { title: "Create Account — PaisaFlow" },
      {
        name: "description",
        content: "Create your PaisaFlow account and start tracking income, expenses and budgets.",
      },
      { property: "og:title", content: "Create Account — PaisaFlow" },
      {
        property: "og:description",
        content: "Create your PaisaFlow account and start tracking income, expenses and budgets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  function validate(): string | null {
    if (fullName.trim().length < 2) return "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email address.";
    if (password.length < 6) return "Passwords must be at least 6 characters long.";
    if (password !== confirm) return "Passwords do not match.";
    if (!agreed) return "Please acknowledge the terms to continue.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    setSent(email);
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`We sent a confirmation link to ${sent}. Click it to activate your account, then sign in.`}
      >
        <Button asChild className="w-full">
          <Link to="/auth">Back to Sign In</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="A few details and you're on your way to better money habits."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField id="full-name" label="Full name">
          <AuthInput
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            placeholder="e.g. Hassan Ahmed"
            required
          />
        </AuthField>
        <AuthField id="email" label="Email">
          <AuthInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </AuthField>
        <AuthField id="password" label="Password">
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            required
          />
        </AuthField>
        <AuthField id="confirm-password" label="Confirm password">
          <PasswordInput
            id="confirm-password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            placeholder="Repeat your password"
            required
          />
        </AuthField>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
          <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
          <span>
            I agree to the PaisaFlow terms of use and acknowledge my data is stored securely.
          </span>
        </label>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create Account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
