import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthField, AuthLayout, PasswordInput, friendlyAuthError } from "@/components/auth/auth-layout";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — PaisaFlow" },
      { name: "description", content: "Set a new password for your PaisaFlow account." },
      { property: "og:title", content: "Reset Password — PaisaFlow" },
      { property: "og:description", content: "Set a new password for your PaisaFlow account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    setRecovery(hash.includes("type=recovery"));
    setReady(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Passwords must be at least 6 characters long.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("Password updated. Welcome back!");
    navigate({ to: "/dashboard" });
  }

  if (!ready) return <AuthLayout title="Reset your password" subtitle="Preparing secure recovery…" ><div /></AuthLayout>;

  if (!recovery) {
    return (
      <AuthLayout
        title="Reset link required"
        subtitle="This page needs a password reset link from your email. Open the latest reset email and click its link, or request a new one."
      >
        <Button asChild className="w-full">
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Pick something strong you don't use anywhere else."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField id="new-password" label="New password">
          <PasswordInput
            id="new-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            required
          />
        </AuthField>
        <AuthField id="confirm-password" label="Confirm new password">
          <PasswordInput
            id="confirm-password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            placeholder="Repeat your new password"
            required
          />
        </AuthField>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Save New Password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
