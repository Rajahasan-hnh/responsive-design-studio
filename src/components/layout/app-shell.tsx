import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Plus,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, updateProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { WelcomeModal } from "@/components/layout/welcome-modal";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/income", label: "Income", icon: TrendingUp },
  { to: "/expenses", label: "Expenses", icon: TrendingDown },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/budgets", label: "Budgets", icon: Wallet },
  { to: "/savings", label: "Savings", icon: PiggyBank },
  { to: "/reports", label: "Reports", icon: FileText },
] as const;

const MOBILE_NAV = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/analytics", label: "Insights", icon: BarChart3 },
  { to: "/budgets", label: "Budgets", icon: Wallet },
] as const;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const a = parts[0] ?? "";
  const b = parts[parts.length - 1] ?? "";
  if (parts.length === 1) return a.slice(0, 2).toUpperCase();
  return ((a[0] ?? "") + (b[0] ?? "")).toUpperCase();
}

export function AppShell({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2.5 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-button">
            <Wallet className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">PaisaFlow</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive(item.to)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="mt-6 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </aside>

      {/* Mobile compact header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">PaisaFlow</span>
        </Link>
        <button
          onClick={() => setProfileOpen(true)}
          aria-label="Open profile"
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground transition-transform active:scale-95"
        >
          {initialsOf(profile?.full_name ?? "")}
        </button>
      </header>

      {/* Page content */}
      <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 sm:px-6 sm:pt-7 lg:pb-12 lg:pl-8 lg:pt-10 xl:px-8">
        {children}
      </main>

      {/* Mobile bottom navigation + floating quick-add */}
      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {MOBILE_NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
              isActive(item.to) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => setProfileOpen(true)}
          className="flex cursor-pointer flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-muted-foreground"
          aria-label="Profile"
        >
          <User className="h-5 w-5" />
          Profile
        </button>
      </nav>

      <button
        onClick={() => setAddOpen(true)}
        aria-label="Quick add transaction"
        className="fixed bottom-20 right-5 z-40 grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform hover:scale-105 active:scale-95 lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-8 right-8 z-40 hidden cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lift transition-transform hover:scale-105 active:scale-95 lg:flex"
        aria-label="Add transaction"
      >
        <Plus className="h-5 w-5" />
        Add Transaction
      </button>

      {/* Profile sheet */}
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} onSignOut={handleSignOut} />

      <TransactionDialog open={addOpen} onOpenChange={setAddOpen} />

      {profile ? <WelcomeModal fullName={profile.full_name} /> : null}
    </div>
  );
}

function ProfileSheet({
  open,
  onOpenChange,
  onSignOut,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSignOut: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loaded, setLoaded] = useState(false);

  if (open && !loaded) {
    setLoaded(true);
    setName(profile?.full_name ?? "");
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }
  if (!open && loaded) setLoaded(false);

  const save = useMutation({
    mutationFn: async () => {
      if (name.trim().length < 2) throw new Error("Please enter your full name.");
      await updateProfile({ data: { full_name: name.trim() } });
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-sm bg-card p-6 sm:max-w-sm">
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="text-lg font-bold tracking-tight">Your profile</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {initialsOf(profile?.full_name ?? "")}
          </span>
          <div>
            <p className="font-semibold text-foreground">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="mt-6 space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-lg"
              placeholder="Your name"
            />
          </div>
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </form>
        <Button
          variant="outline"
          className="mt-3 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </SheetContent>
    </Sheet>
  );
}
