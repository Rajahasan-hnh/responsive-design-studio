-- PaisaFlow core schema
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  currency text not null default 'PKR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income','expense')),
  color text not null default '#1e3a5f',
  created_at timestamptz not null default now(),
  unique (user_id, name, kind)
);
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Users manage own categories" on public.categories for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric(14,2) not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "Users manage own transactions" on public.transactions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  monthly_limit numeric(14,2) not null check (monthly_limit > 0),
  month date not null,
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);
grant select, insert, update, delete on public.budgets to authenticated;
grant all on public.budgets to service_role;
alter table public.budgets enable row level security;
create policy "Users manage own budgets" on public.budgets for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  saved_amount numeric(14,2) not null default 0 check (saved_amount >= 0),
  icon text not null default 'target',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.savings_goals to authenticated;
grant all on public.savings_goals to service_role;
alter table public.savings_goals enable row level security;
create policy "Users manage own savings goals" on public.savings_goals for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile and seed default categories on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid := new.id;
  display_name text := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'friend'), '@', 1)
  );
begin
  insert into public.profiles (id, full_name)
  values (new_id, display_name)
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, kind, color) values
    (new_id, 'Food', 'expense', '#e05c4f'),
    (new_id, 'Transport', 'expense', '#3b7dd8'),
    (new_id, 'Utilities', 'expense', '#e8a33d'),
    (new_id, 'Shopping', 'expense', '#8e6fc4'),
    (new_id, 'Health', 'expense', '#3fa17b'),
    (new_id, 'Entertainment', 'expense', '#d8619c'),
    (new_id, 'Education', 'expense', '#5b8bb0'),
    (new_id, 'Other', 'expense', '#7a8aa0'),
    (new_id, 'Salary', 'income', '#2e7d5b'),
    (new_id, 'Freelance', 'income', '#3b7dd8'),
    (new_id, 'Business', 'income', '#e8a33d'),
    (new_id, 'Investment', 'income', '#8e6fc4'),
    (new_id, 'Other', 'income', '#7a8aa0')
  on conflict (user_id, name, kind) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
