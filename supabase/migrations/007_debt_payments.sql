-- Track when debtors self-report paying a resolved bet debt.
-- Unique per (bet, payer, payee) so a debt can only be marked paid once.

create table if not exists public.debt_payments (
  id            uuid primary key default gen_random_uuid(),
  bet_id        uuid not null references public.bets(id) on delete cascade,
  from_user_id  uuid not null references public.profiles(id) on delete cascade,
  to_user_id    uuid not null references public.profiles(id) on delete cascade,
  amount        numeric(10, 2) not null,
  created_at    timestamptz not null default now(),
  unique (bet_id, from_user_id, to_user_id)
);

alter table public.debt_payments enable row level security;

-- Anyone in the group can view payments for bets in their group
create policy "Group members can view debt payments"
  on public.debt_payments for select
  using (
    exists (
      select 1 from public.bets b
      join public.group_members gm on gm.group_id = b.group_id
      where b.id = debt_payments.bet_id
        and gm.user_id = auth.uid()
    )
  );

-- Only the payer (from_user_id) can insert a payment record
create policy "Payer can record debt payment"
  on public.debt_payments for insert
  with check (auth.uid() = from_user_id);
