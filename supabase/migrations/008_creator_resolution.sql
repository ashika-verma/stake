alter table public.bets
  add column if not exists creator_resolved_at timestamptz,
  add column if not exists creator_resolved_outcome text
    check (creator_resolved_outcome in ('yes', 'no'));
