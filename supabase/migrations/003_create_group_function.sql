-- Atomic group creation function using security definer to avoid
-- RLS timing issues where auth.uid() isn't set during policy evaluation
-- in Next.js server actions.

create or replace function public.create_group(
  p_name text,
  p_invite_code text
)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_group public.groups;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.groups (name, invite_code, created_by)
  values (p_name, p_invite_code, v_user_id)
  returning * into v_group;

  insert into public.group_members (group_id, user_id)
  values (v_group.id, v_user_id);

  return v_group;
end;
$$;

-- Same pattern for placing bets, casting votes, and joining groups
create or replace function public.join_group(
  p_invite_code text
)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_group public.groups;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_group
  from public.groups
  where invite_code = upper(trim(p_invite_code));

  if v_group is null then
    raise exception 'Invalid invite code';
  end if;

  -- upsert — safe to call if already a member
  insert into public.group_members (group_id, user_id)
  values (v_group.id, v_user_id)
  on conflict (group_id, user_id) do nothing;

  return v_group;
end;
$$;
