/*
# Add HSE Officer Review columns to reports

Adds columns to store the HSE officer's review of each AI analysis result.
This implements the "human-in-the-loop" review step: after the AI produces
its analysis, an HSE officer reviews the output, can override the SIF level,
add comments, and confirm the recommended action before the report is saved.

1. Modified Tables
- `reports`: added 5 new nullable columns
  - hse_reviewer_name: name of the reviewing HSE officer (text)
  - hse_review_comments: officer's free-text review notes (text)
  - hse_review_level: officer's SIF level override if they disagree with AI (text)
  - hse_confirmed_action: officer's confirmed/edited follow-up action (text)
  - hse_reviewed_at: timestamp when the review was completed (timestamptz)

2. Security
- No RLS changes needed; existing policies already allow full CRUD for anon+authenticated.

3. Notes
- All new columns are nullable so existing seed data is unaffected.
- The app will treat a non-null hse_reviewer_name as "reviewed by an officer."
*/
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS hse_reviewer_name text,
  ADD COLUMN IF NOT EXISTS hse_review_comments text,
  ADD COLUMN IF NOT EXISTS hse_review_level text,
  ADD COLUMN IF NOT EXISTS hse_confirmed_action text,
  ADD COLUMN IF NOT EXISTS hse_reviewed_at timestamptz;