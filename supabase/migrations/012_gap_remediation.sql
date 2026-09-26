-- Gap remediation: PIN cache, reports, suspended users, verified donor, archived communities

CREATE TABLE IF NOT EXISTS pincode_cache (
  pincode TEXT PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  display_location TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pincode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY pincode_cache_read ON pincode_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY pincode_cache_service ON pincode_cache FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('chat_thread', 'community', 'blood_request', 'profile')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_reports_status_idx ON content_reports(status, created_at DESC);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_reports_insert ON content_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY content_reports_admin_read ON content_reports FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'suspended';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_donor BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS blood_requests_deadline_status_idx
  ON blood_requests(status, deadline)
  WHERE status IN ('open', 'partially_filled');

CREATE INDEX IF NOT EXISTS donor_invitations_request_donor_idx
  ON donor_invitations(request_id, donor_id);
