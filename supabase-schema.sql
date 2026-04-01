-- SculptBuilder database schema
-- Run this in your Supabase SQL editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Routines table
create table routines (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'Untitled Routine',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Tracks table
create table tracks (
  id uuid primary key default uuid_generate_v4(),
  routine_id uuid references routines(id) on delete cascade not null,
  name text not null default 'New Track',
  duration integer not null default 5,
  muscles text[] not null default '{}',
  notes text not null default '',
  position integer not null default 0
);

-- Exercises table
create table exercises (
  id uuid primary key default uuid_generate_v4(),
  track_id uuid references tracks(id) on delete cascade not null,
  name text not null,
  counts text not null default '32 counts',
  position integer not null default 0
);

-- Row Level Security
alter table routines enable row level security;
alter table tracks enable row level security;
alter table exercises enable row level security;

-- Policies: users can only access their own routines
create policy "Users can view own routines"
  on routines for select using (auth.uid() = user_id);

create policy "Users can insert own routines"
  on routines for insert with check (auth.uid() = user_id);

create policy "Users can update own routines"
  on routines for update using (auth.uid() = user_id);

create policy "Users can delete own routines"
  on routines for delete using (auth.uid() = user_id);

-- Tracks: access through routine ownership
create policy "Users can view own tracks"
  on tracks for select using (
    exists (select 1 from routines where routines.id = tracks.routine_id and routines.user_id = auth.uid())
  );

create policy "Users can insert own tracks"
  on tracks for insert with check (
    exists (select 1 from routines where routines.id = tracks.routine_id and routines.user_id = auth.uid())
  );

create policy "Users can update own tracks"
  on tracks for update using (
    exists (select 1 from routines where routines.id = tracks.routine_id and routines.user_id = auth.uid())
  );

create policy "Users can delete own tracks"
  on tracks for delete using (
    exists (select 1 from routines where routines.id = tracks.routine_id and routines.user_id = auth.uid())
  );

-- Exercises: access through track -> routine ownership
create policy "Users can view own exercises"
  on exercises for select using (
    exists (
      select 1 from tracks
      join routines on routines.id = tracks.routine_id
      where tracks.id = exercises.track_id and routines.user_id = auth.uid()
    )
  );

create policy "Users can insert own exercises"
  on exercises for insert with check (
    exists (
      select 1 from tracks
      join routines on routines.id = tracks.routine_id
      where tracks.id = exercises.track_id and routines.user_id = auth.uid()
    )
  );

create policy "Users can update own exercises"
  on exercises for update using (
    exists (
      select 1 from tracks
      join routines on routines.id = tracks.routine_id
      where tracks.id = exercises.track_id and routines.user_id = auth.uid()
    )
  );

create policy "Users can delete own exercises"
  on exercises for delete using (
    exists (
      select 1 from tracks
      join routines on routines.id = tracks.routine_id
      where tracks.id = exercises.track_id and routines.user_id = auth.uid()
    )
  );

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger routines_updated_at
  before update on routines
  for each row execute function update_updated_at();

-- Indexes
create index idx_routines_user_id on routines(user_id);
create index idx_tracks_routine_id on tracks(routine_id);
create index idx_exercises_track_id on exercises(track_id);

-- View for routine summaries (used on dashboard)
create or replace view routine_summaries as
select
  r.id,
  r.user_id,
  r.name,
  r.created_at,
  r.updated_at,
  coalesce(sum(t.duration), 0)::integer as total_duration,
  count(distinct t.id)::integer as track_count
from routines r
left join tracks t on t.routine_id = r.id
group by r.id;
