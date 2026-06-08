-- Add selfie photo columns to profiles.
-- photo_url: the CDN URL returned by api.market (expires after 7 days).
-- photo_uploaded_at: when the photo was uploaded, used to compute expiry client-side.
ALTER TABLE profiles
  ADD COLUMN photo_url text,
  ADD COLUMN photo_uploaded_at timestamptz;
