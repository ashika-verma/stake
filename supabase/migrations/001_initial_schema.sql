-- ============================================================
-- TYPES
-- ============================================================
create type public.bet_status as enum ('open', 'voting', 'resolved', 'cancelled');
create type public.bet_outcome as enum ('yes', 'no');
create type public.prediction as enum ('yes', 'no');
create type public.vote_value as enum ('yes', 'no');

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null,
  venmo_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  description text,
  resolution_date date not null,
  status public.bet_status not null default 'open',
  outcome public.bet_outcome,
  voting_opened_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bet_participations (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  prediction public.prediction not null,
  pledge_amount numeric(10, 2) not null check (pledge_amount > 0),
  created_at timestamptz not null default now(),
  unique (bet_id, user_id)
);

create table if not exists public.resolution_votes (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote public.vote_value not null,
  created_at timestamptz not null default now(),
  unique (bet_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY — enable on all tables
-- ============================================================
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.bets enable row level security;
alter table public.bet_participations enable row level security;
alter table public.resolution_votes enable row level security;

-- ============================================================
-- POLICIES — profiles
-- ============================================================
create policy "Users can view any profile"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- POLICIES — groups
-- ============================================================
create policy "Group members can view groups"
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = id
        and gm.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create groups"
  on public.groups for insert
  with check (auth.uid() = created_by);

create policy "Group creator can update group"
  on public.groups for update
  using (auth.uid() = created_by);

-- ============================================================
-- POLICIES — group_members
-- IMPORTANT: inner query aliased as gm_inner to avoid self-referencing RLS recursion
-- ============================================================
create policy "Members can view other members of their groups"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm_inner
      where gm_inner.group_id = group_id
        and gm_inner.user_id = auth.uid()
    )
  );

create policy "Users can join groups (insert own membership)"
  on public.group_members for insert
  with check (auth.uid() = user_id);

create policy "Users can leave groups (delete own membership)"
  on public.group_members for delete
  using (auth.uid() = user_id);

-- ============================================================
-- POLICIES — bets
-- ============================================================
create policy "Group members can view bets"
  on public.bets for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = bets.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Group members can create bets"
  on public.bets for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = bets.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Group members can update bets"
  on public.bets for update
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = bets.group_id
        and gm.user_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES — bet_participations
-- ============================================================
create policy "Group members can view participations"
  on public.bet_participations for select
  using (
    exists (
      select 1 from public.bets b
      join public.group_members gm on gm.group_id = b.group_id
      where b.id = bet_participations.bet_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Users can create own participation"
  on public.bet_participations for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.bets b
      join public.group_members gm on gm.group_id = b.group_id
      where b.id = bet_participations.bet_id
        and gm.user_id = auth.uid()
        and b.status = 'open'
    )
  );

-- ============================================================
-- POLICIES — resolution_votes
-- ============================================================
create policy "Group members can view votes"
  on public.resolution_votes for select
  using (
    exists (
      select 1 from public.bets b
      join public.group_members gm on gm.group_id = b.group_id
      where b.id = resolution_votes.bet_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Participants can vote"
  on public.resolution_votes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.bets b
      where b.id = resolution_votes.bet_id
        and b.status = 'voting'
    )
    and exists (
      select 1 from public.bet_participations bp
      where bp.bet_id = resolution_votes.bet_id
        and bp.user_id = auth.uid()
    )
  );

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_groups_updated_at
  before update on public.groups
  for each row execute procedure public.handle_updated_at();

create trigger handle_bets_updated_at
  before update on public.bets
  for each row execute procedure public.handle_updated_at();
