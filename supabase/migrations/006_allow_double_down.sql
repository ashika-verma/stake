-- Allow unlimited bets per side (double down, triple down, etc.)
-- Remove the per-side unique constraint entirely.
alter table public.bet_participations
  drop constraint bet_participations_bet_id_user_id_prediction_key;
