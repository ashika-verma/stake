create or replace function cancel_bet(p_bet_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.bets
  set status = 'cancelled', outcome = null, updated_at = now()
  where id = p_bet_id
    and status = 'open'
    and created_by = auth.uid();
  if not found then
    raise exception 'Cannot cancel: bet not found, not open, or not creator';
  end if;
end;
$$;
