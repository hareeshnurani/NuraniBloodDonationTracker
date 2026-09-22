-- Fix private community creation (founder cannot insert first membership under RLS)
-- and let community members see co-member names on the community page.

CREATE POLICY "Creator joins own community" ON community_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_id AND c.creator_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION shares_community_with(p_other_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM community_members cm_self
    INNER JOIN community_members cm_other
      ON cm_self.community_id = cm_other.community_id
    WHERE cm_self.user_id = auth.uid()
      AND cm_other.user_id = p_other_user_id
  );
$$;

CREATE POLICY "Community peers view basic profile" ON profiles FOR SELECT
  USING (shares_community_with(id));

CREATE OR REPLACE FUNCTION is_community_linked_request(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM request_communities rc
    INNER JOIN community_members cm ON cm.community_id = rc.community_id
    WHERE rc.request_id = p_request_id
      AND cm.user_id = auth.uid()
  );
$$;

CREATE POLICY "Community members view linked requests" ON blood_requests FOR SELECT
  USING (is_community_linked_request(id));
