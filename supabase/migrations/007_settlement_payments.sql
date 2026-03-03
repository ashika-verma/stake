create table public.settlement_payments (
  id            uuid primary key default gen_random_uuid(),
  bet_id        uuid not null references public.bets(id) on delete cascade,
  from_user_id  uuid not null references public.profiles(id),
  to_user_id    uuid not null references public.profiles(id),
  amount        numeric(10,2) not null check (amount > 0),
  marked_at     timestamptz not null default now(),
  unique (bet_id, from_user_id, to_user_id)
);

alter table public.settlement_payments enable row level security;

-- Any participant in the bet can see payments for it
create policy "participants can view payments"
  on public.settlement_payments for select
  using (
    exists (
      select 1 from public.bet_participations bp
      where bp.bet_id = settlement_payments.bet_id
        and bp.user_id = auth.uid()
    )
  );

-- Only the payer can insert
create policy "payer can mark paid"
  on public.settlement_payments for insert
  with check (from_user_id = auth.uid());

-- Only the payer can undo
create policy "payer can unmark paid"
  on public.settlement_payments for delete
  using (from_user_id = auth.uid());
