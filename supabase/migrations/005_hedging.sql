-- Allow hedging: one bet per side per user (yes + no both allowed)
-- Change unique constraint from (bet_id, user_id) to (bet_id, user_id, prediction)

alter table public.bet_participations
  drop constraint bet_participations_bet_id_user_id_key;

alter table public.bet_participations
  add constraint bet_participations_bet_id_user_id_prediction_key
  unique (bet_id, user_id, prediction);

-- Update place_bet to use new unique constraint
create or replace function public.place_bet(
  p_bet_id uuid,
  p_prediction text,
  p_pledge_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_bet_status text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select status into v_bet_status from public.bets where id = p_bet_id;

  if v_bet_status is null then raise exception 'Bet not found'; end if;
  if v_bet_status <> 'open' then raise exception 'Bet is not open'; end if;

  insert into public.bet_participations (bet_id, user_id, prediction, pledge_amount)
  values (p_bet_id, v_user_id, p_prediction::public.prediction, p_pledge_amount);
  -- unique on (bet_id, user_id, prediction) — duplicate side raises 23505
end;
$$;

-- cast_vote already uses EXISTS on bet_participations so no change needed there.
-- But resolveIfReady needs distinct user count for quorum, handled in app code.
