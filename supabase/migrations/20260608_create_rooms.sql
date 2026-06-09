-- Play together rooms — users can create a meetup room and others can join.
-- One active room per creator is enforced at the application layer.

create type trail_level_type as enum ('Beginner', 'Intermediate', 'Advanced', 'Expert');

create table rooms (
  id               uuid primary key default gen_random_uuid(),
  creator_id       uuid not null references profiles(id) on delete cascade,
  message          text not null,
  meeting_location text not null,
  trail_level      trail_level_type not null,
  expires_at       timestamptz not null,
  created_at       timestamptz not null default now()
);

alter table rooms enable row level security;

-- RLS: select only returns rooms that haven't expired yet
create policy "Anyone can read active rooms"
  on rooms for select
  using (expires_at > now());

create policy "Users can create rooms"
  on rooms for insert
  with check (auth.uid() = creator_id);

create policy "Creators can delete own rooms"
  on rooms for delete
  using (auth.uid() = creator_id);

-- Tracks which users have joined which rooms
create table room_joins (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references rooms(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (room_id, user_id)
);

alter table room_joins enable row level security;

-- Join counts need to be readable by everyone
create policy "Anyone can read room joins"
  on room_joins for select
  using (true);

create policy "Users can join rooms"
  on room_joins for insert
  with check (auth.uid() = user_id);

create policy "Users can leave rooms"
  on room_joins for delete
  using (auth.uid() = user_id);
