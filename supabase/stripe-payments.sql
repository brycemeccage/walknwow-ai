-- WalkNWow Stripe payment ledger
create table if not exists public.project_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  amount_total integer not null default 0,
  currency text not null default 'usd',
  payment_status text not null,
  package_name text,
  addons text not null default '',
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists project_payments_project_id_idx
  on public.project_payments(project_id);

create index if not exists project_payments_user_id_idx
  on public.project_payments(user_id);

alter table public.project_payments enable row level security;

drop policy if exists "Users can read own project payments" on public.project_payments;
create policy "Users can read own project payments"
on public.project_payments
for select
to authenticated
using (user_id = auth.uid());
