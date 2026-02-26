-- Security definer functions for all write operations so that
-- auth.uid() is always available regardless of RLS evaluation timing.

create or replace function public.create_bet(
  p_group_id uuid,
  p_title text,
  p_description text,
  p_resolution_date date
)
returns public.bets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_bet public.bets;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  -- Verify user is a member of the group
  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = v_user_id
  ) then
    raise exception 'Not a member of this group';
  end if;

  insert into public.bets (group_id, title, description, resolution_date, created_by)
  values (p_group_id, p_title, p_description, p_resolution_date, v_user_id)
  returning * into v_bet;

  return v_bet;
end;
$$;

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
end;
$$;

create or replace function public.cast_vote(
  p_bet_id uuid,
  p_vote text
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

  if v_bet_status <> 'voting' then raise exception 'Bet is not in voting phase'; end if;

  -- Verify user participated
  if not exists (
    select 1 from public.bet_participations
    where bet_id = p_bet_id and user_id = v_user_id
  ) then
    raise exception 'You did not participate in this bet';
  end if;

  insert into public.resolution_votes (bet_id, user_id, vote)
  values (p_bet_id, v_user_id, p_vote::public.vote_value);
end;
$$;

create or replace function public.open_voting(
  p_bet_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  v_today := current_date;

  update public.bets
  set status = 'voting', voting_opened_at = now()
  where id = p_bet_id
    and status = 'open'
    and resolution_date <= v_today;
end;
$$;

create or replace function public.resolve_bet(
  p_bet_id uuid,
  p_outcome text,   -- 'yes', 'no', or null for cancelled
  p_cancelled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  if p_cancelled then
    update public.bets
    set status = 'cancelled', outcome = null
    where id = p_bet_id and status = 'voting';
  else
    update public.bets
    set status = 'resolved', outcome = p_outcome::public.bet_outcome
    where id = p_bet_id and status = 'voting';
  end if;
end;
$$;
