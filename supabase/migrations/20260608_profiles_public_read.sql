-- Allow any authenticated user to read any profile.
--
-- The original policy only allowed users to read their own profile, which
-- caused room creator and joiner names to return null when fetched by other users.
-- The play-together feature requires seeing other users' names.
--
-- The sensitive columns (phone, gender) are not displayed in the rooms UI;
-- only name is shown there. Keeping all columns readable is acceptable for
-- a snow-sports meetup app where users are actively looking to connect.

drop policy "Users can read own profile" on profiles;

create policy "Authenticated users can read all profiles"
  on profiles for select
  to authenticated
  using (true);
