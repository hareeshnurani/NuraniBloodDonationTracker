-- Communities feature: groups, membership, request cross-posting, pins, donor preferences

CREATE TYPE community_visibility AS ENUM ('public', 'private');

-- Communities
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  visibility community_visibility NOT NULL DEFAULT 'public',
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE community_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE request_communities (
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (request_id, community_id)
);

CREATE TABLE user_community_pins (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, community_id)
);

-- Donor notification preference
ALTER TABLE donor_profiles
  ADD COLUMN IF NOT EXISTS notify_community_only BOOLEAN NOT NULL DEFAULT FALSE;

-- Auto-approve existing pending users
UPDATE profiles SET status = 'active' WHERE status = 'pending_approval';

-- Indexes
CREATE INDEX idx_communities_creator ON communities(creator_id);
CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_request_communities_community ON request_communities(community_id);
CREATE INDEX idx_request_communities_request ON request_communities(request_id);
CREATE INDEX idx_user_community_pins_user ON user_community_pins(user_id, sort_order);
CREATE INDEX idx_community_invites_code ON community_invites(code);

CREATE TRIGGER communities_updated_at BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_community_pins ENABLE ROW LEVEL SECURITY;

-- Helper: is community member
CREATE OR REPLACE FUNCTION is_community_member(p_community_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is community admin
CREATE OR REPLACE FUNCTION is_community_admin(p_community_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id AND user_id = auth.uid() AND is_admin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Communities policies
CREATE POLICY "View public communities or member communities" ON communities FOR SELECT
  USING (
    visibility = 'public'
    OR is_community_member(id)
    OR is_admin()
  );

CREATE POLICY "Active users create communities" ON communities FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Community admins update communities" ON communities FOR UPDATE
  USING (is_community_admin(id) OR is_admin());

-- Community members policies
CREATE POLICY "View community members" ON community_members FOR SELECT
  USING (
    is_community_member(community_id)
    OR EXISTS (SELECT 1 FROM communities c WHERE c.id = community_id AND c.visibility = 'public')
    OR is_admin()
  );

CREATE POLICY "Join public communities" ON community_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_id AND c.visibility = 'public'
    )
  );

CREATE POLICY "Admins add members to private communities" ON community_members FOR INSERT
  WITH CHECK (
    is_community_admin(community_id) OR is_admin()
  );

CREATE POLICY "Users leave communities" ON community_members FOR DELETE
  USING (auth.uid() = user_id OR is_community_admin(community_id) OR is_admin());

CREATE POLICY "Admins update member roles" ON community_members FOR UPDATE
  USING (is_community_admin(community_id) OR is_admin());

-- Community invites
CREATE POLICY "Community admins manage invites" ON community_invites FOR ALL
  USING (is_community_admin(community_id) OR is_admin());

CREATE POLICY "Anyone can read invite by code lookup" ON community_invites FOR SELECT
  USING (TRUE);

-- Request communities
CREATE POLICY "View request community links" ON request_communities FOR SELECT USING (TRUE);

CREATE POLICY "Requester links communities" ON request_communities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blood_requests br
      WHERE br.id = request_id AND br.requester_id = auth.uid()
    )
    AND is_community_member(community_id)
  );

-- User community pins
CREATE POLICY "Users manage own pins" ON user_community_pins FOR ALL
  USING (auth.uid() = user_id);

-- Allow all active users to browse open blood requests
CREATE POLICY "Active users view open requests" ON blood_requests FOR SELECT
  USING (
    status IN ('open', 'partially_filled')
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'active')
  );
