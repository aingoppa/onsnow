-- Simplify profiles: drop location fields that aren't needed for the product,
-- and make birth_year optional so guest users can skip it.

ALTER TABLE profiles
  DROP COLUMN city,
  DROP COLUMN state,
  DROP COLUMN country,
  ALTER COLUMN birth_year DROP NOT NULL;
