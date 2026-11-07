alter table public.categories alter column user_id set default auth.uid();
alter table public.transactions alter column user_id set default auth.uid();
alter table public.budgets alter column user_id set default auth.uid();
alter table public.savings_goals alter column user_id set default auth.uid();