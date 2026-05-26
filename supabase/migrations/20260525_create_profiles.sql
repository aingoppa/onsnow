-- Migration: create profiles table
-- Run date: 2026-05-25

-- Create the gender enum type
create type gender_type as enum ('Male', 'Female', 'Rather not say', 'Custom');

-- Create the profiles table
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  birth_year  integer not null,
  gender      gender_type,
  custom_gender text check (char_length(custom_gender) <= 50),
  city        text not null,
  state       text not null,
  country     text not null check (country in ('US', 'Canada')),
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Enable Row Level Security (RLS) so users can only access their own profile
alter table profiles enable row level security;

-- Allow users to read their own profile
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Allow users to insert their own profile
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
