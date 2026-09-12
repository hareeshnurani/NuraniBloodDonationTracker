-- Blood Donation Request Management System - Initial Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_status AS ENUM ('profile_incomplete', 'pending_approval', 'active', 'rejected');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE blood_group AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE request_priority AS ENUM ('emergency', 'routine');
CREATE TYPE request_status AS ENUM ('draft', 'open', 'partially_filled', 'fulfilled', 'closed', 'expired');
CREATE TYPE closure_type AS ENUM ('manual', 'auto_fulfilled', 'expired');
CREATE TYPE invitation_response AS ENUM ('pending', 'accepted', 'rejected', 'late_accept');
CREATE TYPE donation_confirm_status AS ENUM ('pending', 'donated', 'not_donated');
CREATE TYPE notification_type AS ENUM (
  'new_request', 'invite_accepted', 'request_fulfilled', 'request_closed',
  'deadline_warning', 'donation_confirm', 'user_approved', 'user_rejected', 'admin_message'
);
CREATE TYPE thread_status AS ENUM ('active', 'closed');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status user_status NOT NULL DEFAULT 'profile_incomplete',
  role user_role NOT NULL DEFAULT 'user',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE donor_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  blood_group blood_group NOT NULL,
  last_donation_date DATE,
  is_available BOOLEAN NOT NULL DEFAULT FALSE,
  willing_to_donate BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE blood_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  primary_blood_group blood_group NOT NULL,
  units_needed INT NOT NULL CHECK (units_needed > 0 AND units_needed <= 10),
  units_filled INT NOT NULL DEFAULT 0 CHECK (units_filled >= 0),
  priority request_priority NOT NULL DEFAULT 'routine',
  deadline TIMESTAMPTZ NOT NULL,
  status request_status NOT NULL DEFAULT 'draft',
  accepts_replacement BOOLEAN NOT NULL DEFAULT FALSE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  hospital_notes TEXT,
  closure_reason TEXT,
  closure_type closure_type,
  extension_prompted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (units_filled <= units_needed)
);

CREATE TABLE request_replacement_groups (
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  blood_group blood_group NOT NULL,
  PRIMARY KEY (request_id, blood_group)
);

CREATE TABLE donor_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_replacement_match BOOLEAN NOT NULL DEFAULT FALSE,
  distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
  response invitation_response NOT NULL DEFAULT 'pending',
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, donor_id)
);

CREATE TABLE donation_confirmations (
  invitation_id UUID PRIMARY KEY REFERENCES donor_invitations(id) ON DELETE CASCADE,
  status donation_confirm_status NOT NULL DEFAULT 'pending',
  donated_date DATE,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status thread_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, donor_id)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_blood_requests_requester ON blood_requests(requester_id);
CREATE INDEX idx_blood_requests_status ON blood_requests(status);
CREATE INDEX idx_donor_invitations_donor ON donor_invitations(donor_id);
CREATE INDEX idx_donor_invitations_request ON donor_invitations(request_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER donor_profiles_updated_at BEFORE UPDATE ON donor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER blood_requests_updated_at BEFORE UPDATE ON blood_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'profile_incomplete'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Haversine distance in km
CREATE OR REPLACE FUNCTION haversine_km(
  lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  r CONSTANT DOUBLE PRECISION := 6371;
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  a := SIN(dlat/2)^2 + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2)^2;
  RETURN r * 2 * ASIN(SQRT(a));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Donor eligibility helper
CREATE OR REPLACE FUNCTION is_donor_eligible(last_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  IF last_date IS NULL THEN RETURN FALSE; END IF;
  RETURN (last_date + INTERVAL '90 days')::DATE <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atomic accept invitation
CREATE OR REPLACE FUNCTION accept_invitation(p_invitation_id UUID, p_donor_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_request blood_requests%ROWTYPE;
  v_invitation donor_invitations%ROWTYPE;
  v_thread_id UUID;
BEGIN
  SELECT * INTO v_invitation FROM donor_invitations
  WHERE id = p_invitation_id AND donor_id = p_donor_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  IF v_invitation.response = 'accepted' AND v_invitation.is_confirmed THEN
    RETURN jsonb_build_object('success', true, 'already_confirmed', true);
  END IF;

  SELECT * INTO v_request FROM blood_requests
  WHERE id = v_invitation.request_id FOR UPDATE;

  IF v_request.status IN ('fulfilled', 'closed', 'expired') THEN
    UPDATE donor_invitations SET response = 'late_accept', responded_at = NOW()
    WHERE id = p_invitation_id;
    RETURN jsonb_build_object('success', false, 'error', 'Request already fulfilled');
  END IF;

  IF v_request.units_filled >= v_request.units_needed THEN
    UPDATE donor_invitations SET response = 'late_accept', responded_at = NOW()
    WHERE id = p_invitation_id;
    RETURN jsonb_build_object('success', false, 'error', 'Request already fulfilled');
  END IF;

  UPDATE donor_invitations
  SET response = 'accepted', is_confirmed = TRUE, responded_at = NOW()
  WHERE id = p_invitation_id;

  UPDATE blood_requests
  SET units_filled = units_filled + 1,
      status = CASE
        WHEN units_filled + 1 >= units_needed THEN 'fulfilled'
        ELSE 'partially_filled'
      END,
      closure_type = CASE
        WHEN units_filled + 1 >= units_needed THEN 'auto_fulfilled'
        ELSE closure_type
      END
  WHERE id = v_request.id
  RETURNING * INTO v_request;

  INSERT INTO chat_threads (request_id, requester_id, donor_id)
  VALUES (v_request.id, v_request.requester_id, p_donor_id)
  ON CONFLICT (request_id, donor_id) DO NOTHING
  RETURNING id INTO v_thread_id;

  IF v_request.status = 'fulfilled' THEN
    INSERT INTO donation_confirmations (invitation_id)
    SELECT id FROM donor_invitations
    WHERE request_id = v_request.id AND is_confirmed = TRUE
    ON CONFLICT (invitation_id) DO NOTHING;

    UPDATE donor_invitations SET response = 'late_accept'
    WHERE request_id = v_request.id AND response = 'pending';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'units_filled', v_request.units_filled,
    'units_needed', v_request.units_needed,
    'status', v_request.status,
    'thread_id', v_thread_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_replacement_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());

-- Donor profiles
CREATE POLICY "View own or admin donor profile" ON donor_profiles FOR SELECT
  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Manage own donor profile" ON donor_profiles FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Admin manage donor profiles" ON donor_profiles FOR ALL
  USING (is_admin());

-- Blood requests
CREATE POLICY "Requester manages own requests" ON blood_requests FOR ALL
  USING (auth.uid() = requester_id);
CREATE POLICY "Donors view invited requests" ON blood_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM donor_invitations di
      WHERE di.request_id = blood_requests.id AND di.donor_id = auth.uid()
    ) OR is_admin()
  );
CREATE POLICY "Admin all requests" ON blood_requests FOR ALL USING (is_admin());

-- Replacement groups
CREATE POLICY "View replacement groups" ON request_replacement_groups FOR SELECT USING (TRUE);
CREATE POLICY "Requester manage replacement groups" ON request_replacement_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM blood_requests br WHERE br.id = request_id AND br.requester_id = auth.uid()));

-- Invitations
CREATE POLICY "Donors view own invitations" ON donor_invitations FOR SELECT
  USING (donor_id = auth.uid() OR is_admin() OR EXISTS (
    SELECT 1 FROM blood_requests br WHERE br.id = request_id AND br.requester_id = auth.uid()
  ));
CREATE POLICY "Donors update own invitations" ON donor_invitations FOR UPDATE
  USING (donor_id = auth.uid());
CREATE POLICY "System insert invitations" ON donor_invitations FOR INSERT WITH CHECK (is_admin() OR TRUE);

-- Donation confirmations
CREATE POLICY "Donors manage own confirmations" ON donation_confirmations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM donor_invitations di
    WHERE di.id = invitation_id AND di.donor_id = auth.uid()
  ) OR is_admin());

-- Notifications
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Insert notifications" ON notifications FOR INSERT WITH CHECK (TRUE);

-- Chat
CREATE POLICY "Participants view threads" ON chat_threads FOR SELECT
  USING (requester_id = auth.uid() OR donor_id = auth.uid() OR is_admin());
CREATE POLICY "Participants view messages" ON chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_threads ct
    WHERE ct.id = thread_id AND (ct.requester_id = auth.uid() OR ct.donor_id = auth.uid() OR is_admin())
  ));
CREATE POLICY "Participants send messages" ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM chat_threads ct
      WHERE ct.id = thread_id AND ct.status = 'active'
        AND (ct.requester_id = auth.uid() OR ct.donor_id = auth.uid() OR is_admin())
    )
  );

-- Audit logs
CREATE POLICY "Admins view audit logs" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "Insert audit logs" ON audit_logs FOR INSERT WITH CHECK (TRUE);
