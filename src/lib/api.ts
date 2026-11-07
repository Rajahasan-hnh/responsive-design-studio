import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Budget, Category, Profile, SavingsGoal, Transaction, TxType } from "@/lib/types";

/**
 * PaisaFlow server data layer.
 * Every function requires an authenticated session; RLS scopes all rows
 * to the signed-in user.
 */

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Profile> => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, currency")
      .eq("id", context.userId)
      .single();
    if (error) throw new Error(error.message);
    return data as Profile;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { full_name: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.full_name.trim(), updated_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (
      input:
        | { from?: string; to?: string; type?: TxType; limit?: number }
        | undefined,
    ) => input ?? {},
  )
  .handler(async ({ data, context }): Promise<Transaction[]> => {
    let query = context.supabase
      .from("transactions")
      .select("id, type, amount, category_id, occurred_on, note")
      .order("occurred_on", { ascending: false })
      .limit(data.limit ?? 1000);
    if (data.type) query = query.eq("type", data.type);
    if (data.from) query = query.gte("occurred_on", data.from);
    if (data.to) query = query.lte("occurred_on", data.to);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Transaction[];
  });

export const listCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Category[]> => {
    const { data, error } = await context.supabase
      .from("categories")
      .select("id, name, kind, color")
      .order("kind", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Category[];
  });

export const addCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; kind: TxType; color?: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("categories").insert({
      user_id: context.userId,
      name: data.name.trim(),
      kind: data.kind,
      color: data.color ?? "#1e3a5f",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      type: TxType;
      amount: number;
      category_id: string | null;
      occurred_on: string;
      note?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("transactions").insert({
      user_id: context.userId,
      type: data.type,
      amount: data.amount,
      category_id: data.category_id,
      occurred_on: data.occurred_on,
      note: data.note?.trim() || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      type: TxType;
      amount: number;
      category_id: string | null;
      occurred_on: string;
      note?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("transactions")
      .update({
        type: data.type,
        amount: data.amount,
        category_id: data.category_id,
        occurred_on: data.occurred_on,
        note: data.note?.trim() || null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("transactions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listBudgets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { month: string } | undefined) => input ?? { month: "" })
  .handler(async ({ data, context }): Promise<Budget[]> => {
    let query = context.supabase
      .from("budgets")
      .select("id, category_id, monthly_limit, month")
      .order("created_at", { ascending: true });
    if (data.month) query = query.eq("month", data.month);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Budget[];
  });

export const upsertBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { category_id: string; monthly_limit: number; month: string }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("budgets").upsert(
      {
        user_id: context.userId,
        category_id: data.category_id,
        monthly_limit: data.monthly_limit,
        month: data.month,
      },
      { onConflict: "user_id,category_id,month" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("budgets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SavingsGoal[]> => {
    const { data, error } = await context.supabase
      .from("savings_goals")
      .select("id, name, target_amount, saved_amount, icon")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as SavingsGoal[];
  });

export const addGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; target_amount: number; icon?: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("savings_goals").insert({
      user_id: context.userId,
      name: data.name.trim(),
      target_amount: data.target_amount,
      icon: data.icon ?? "target",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const contributeGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; amount: number }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("savings_goals")
      .select("saved_amount")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const saved = Number(row?.saved_amount ?? 0) + data.amount;
    const { error: upErr } = await context.supabase
      .from("savings_goals")
      .update({ saved_amount: saved })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("savings_goals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
