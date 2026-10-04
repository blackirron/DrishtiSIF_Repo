/*
# SIF Sentinel - Reports table

Creates the core reports table for the SIF Sentinel HSE intelligence platform.
This is a single-tenant hackathon prototype with no authentication — all data is shared/demo.

1. New Tables
- `reports`: stores all safety reports with AI-assisted analysis results
  - id: uuid PK
  - report_id: human-readable ID (e.g., "RPT-0001")
  - report_date: date of the report
  - site: facility/site name
  - report_type: UA/UC, Near-miss, or Incident
  - raw_narrative: the free-text safety report
  - activity: extracted activity category
  - sif_level: HIGH, MEDIUM, LOW, or NON-SIF
  - priority_score: 0-100 SIF priority score
  - life_saving_rule: mapped IOGP Life-Saving Rule
  - hazard: extracted hazard
  - barrier: identified barrier
  - barrier_failure: identified barrier failure
  - potential_consequence: potential consequence description
  - explanation: human-readable explanation
  - evidence: extracted evidence keywords (text[])
  - recommended_action: HSE follow-up action
  - review_status: Pending, Reviewed, Escalated, or Dismissed
  - is_seed: whether this is synthetic demo data
  - created_at: timestamp

2. Security
- RLS enabled
- Anon + authenticated have full CRUD (single-tenant, no auth, intentionally shared demo data)
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id text NOT NULL,
  report_date date NOT NULL,
  site text NOT NULL,
  report_type text NOT NULL DEFAULT 'UA/UC',
  raw_narrative text NOT NULL,
  activity text NOT NULL DEFAULT 'General',
  sif_level text NOT NULL DEFAULT 'LOW',
  priority_score integer NOT NULL DEFAULT 0,
  life_saving_rule text NOT NULL DEFAULT 'None',
  hazard text NOT NULL DEFAULT 'Not identified',
  barrier text NOT NULL DEFAULT 'Not identified',
  barrier_failure text NOT NULL DEFAULT 'None identified',
  potential_consequence text NOT NULL DEFAULT 'No significant consequence identified',
  explanation text NOT NULL DEFAULT '',
  evidence text[] DEFAULT '{}',
  recommended_action text NOT NULL DEFAULT '',
  review_status text NOT NULL DEFAULT 'Pending',
  is_seed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reports" ON reports;
CREATE POLICY "anon_select_reports" ON reports FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reports" ON reports;
CREATE POLICY "anon_insert_reports" ON reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reports" ON reports;
CREATE POLICY "anon_update_reports" ON reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reports" ON reports;
CREATE POLICY "anon_delete_reports" ON reports FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_reports_sif_level ON reports(sif_level);
CREATE INDEX IF NOT EXISTS idx_reports_review_status ON reports(review_status);
CREATE INDEX IF NOT EXISTS idx_reports_life_saving_rule ON reports(life_saving_rule);
CREATE INDEX IF NOT EXISTS idx_reports_activity ON reports(activity);
CREATE INDEX IF NOT EXISTS idx_reports_site ON reports(site);
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(report_date DESC);
