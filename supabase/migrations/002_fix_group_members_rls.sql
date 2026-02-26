-- Fix infinite recursion in group_members RLS policy.
-- The policy was querying group_members from within group_members' own policy.
-- Solution: a security definer function bypasses RLS, breaking the cycle.

create or replace function public.get_my_group_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select group_id from public.group_members where user_id = auth.uid()
$$;

-- Drop the recursive policy and replace it
drop policy if exists "Members can view other members of their groups" on public.group_members;

create policy "Members can view other members of their groups"
  on public.group_members for select
  using (
    group_id = any(select public.get_my_group_ids())
  );

-- Also fix the groups policy which has the same pattern
drop policy if exists "Group members can view groups" on public.groups;

create policy "Group members can view groups"
  on public.groups for select
  using (
    id = any(select public.get_my_group_ids())
  );
