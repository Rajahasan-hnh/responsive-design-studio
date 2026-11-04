import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthField, AuthInput, AuthLayout, friendlyAuthError } from "@/components/auth/auth-layout";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — PaisaFlow" },
      { name: "description", content: "Reset your PaisaFlow account password." },
      { property: "og:title", content: "Forgot Password — PaisaFlow" },
      { property: "og:description", content: "Reset your PaisaFlow account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout
        title="Reset link sent"
        subtitle={`If an account exists for ${email}, a password reset link is on its way. Check your inbox (and spam folder).`}
      >
        <Button asChild className="w-full">
          <Link to="/auth">Back to Sign In</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send you a secure reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/auth" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
