import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PiggyBank, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/page";
import { addGoal, contributeGoal, deleteGoal, listGoals } from "@/lib/api";
import { formatPKR } from "@/lib/format";
import type { SavingsGoal } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/savings")({
  head: () => ({
    meta: [
      { title: "Savings Goals — PaisaFlow" },
      { name: "description", content: "Create savings goals and track your progress toward them in PaisaFlow." },
      { property: "og:title", content: "Savings Goals — PaisaFlow" },
      { property: "og:description", content: "Create savings goals and track your progress toward them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavingsPage,
});

function SavingsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const { data: goals = [] } = useQuery({ queryKey: ["goals"], queryFn: () => listGoals() });

  const create = useMutation({
    mutationFn: async () => {
      const n = Number(target);
      if (name.trim().length < 2) throw new Error("Give your goal a name.");
      if (!n || n <= 0) throw new Error("Enter a target greater than zero.");
      await addGoal({ data: { name, target_amount: n } });
    },
    onSuccess: () => {
      toast.success("Goal created");
      setName("");
      setTarget("");
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalSaved = goals.reduce((a, g) => a + Number(g.saved_amount), 0);
  const totalTarget = goals.reduce((a, g) => a + Number(g.target_amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Savings" subtitle="Put money aside for what matters." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total saved" tone="income" value={formatPKR(totalSaved, { noDecimals: true })} />
        <StatCard
          label="Across all goals"
          value={formatPKR(totalTarget, { noDecimals: true })}
          sub={totalTarget > 0 ? `${Math.round((totalSaved / totalTarget) * 100)}% of targets reached` : "No goals yet"}
          delay={0.05}
        />
      </div>

      <SectionCard title="New goal">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <Input placeholder="e.g. Emergency fund" value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-lg" />
          <Input
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="Target (Rs)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-10 rounded-lg"
          />
          <Button type="submit" disabled={create.isPending}>
            <Plus className="h-4 w-4" /> Create Goal
          </Button>
        </form>
      </SectionCard>

      {goals.length === 0 ? (
        <EmptyState icon={<PiggyBank className="h-5 w-5" />} title="No savings goals yet" hint="Create your first goal above." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {goals.map((g, i) => (
            <GoalCard key={g.id} goal={g} delay={i * 0.05} />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, delay }: { goal: SavingsGoal; delay: number }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const saved = Number(goal.saved_amount);
  const target = Number(goal.target_amount);
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

  const contribute = useMutation({
    mutationFn: async () => {
      const n = Number(amount);
      if (!n || n <= 0) throw new Error("Enter an amount greater than zero.");
      await contributeGoal({ data: { id: goal.id, amount: n } });
    },
    onSuccess: () => {
      toast.success(`Added to ${goal.name}`);
      setAmount("");
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: () => deleteGoal({ data: { id: goal.id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  return (
    <SectionCard delay={delay} className="card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <PiggyBank className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold">{goal.name}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatPKR(saved, { noDecimals: true })} / {formatPKR(target, { noDecimals: true })}
            </p>
          </div>
        </div>
        <button
          onClick={() => remove.mutate()}
          aria-label={`Delete ${goal.name}`}
          className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Progress value={pct} className="h-2 flex-1" />
        <span className="w-10 text-right text-sm font-bold tabular-nums">{pct}%</span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          contribute.mutate();
        }}
        className="mt-4 flex gap-2"
      >
        <Input
          type="number"
          min="0"
          inputMode="decimal"
          placeholder="Add amount (Rs)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded-lg"
        />
        <Button type="submit" variant="secondary" disabled={contribute.isPending}>
          Contribute
        </Button>
      </form>
    </SectionCard>
  );
}
