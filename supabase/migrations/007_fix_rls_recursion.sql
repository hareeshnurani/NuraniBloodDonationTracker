-- Fix infinite recursion between blood_requests and donor_invitations RLS policies.
-- Policies that cross-reference each other's tables cause PostgreSQL recursion errors
-- on INSERT ... RETURNING. Use SECURITY DEFINER helpers to break the cycle.

CREATE OR REPLACE FUNCTION is_request_owner(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM blood_requests
    WHERE id = p_request_id AND requester_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_invited_donor(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM donor_invitations
    WHERE request_id = p_request_id AND donor_id = auth.uid()
  );
$$;

-- blood_requests: stop querying donor_invitations directly in policy
DROP POLICY IF EXISTS "Donors view invited requests" ON blood_requests;
CREATE POLICY "Donors view invited requests" ON blood_requests FOR SELECT
  USING (is_invited_donor(id) OR is_admin());

-- donor_invitations: stop querying blood_requests directly in policy
DROP POLICY IF EXISTS "Donors view own invitations" ON donor_invitations;
CREATE POLICY "Donors view own invitations" ON donor_invitations FOR SELECT
  USING (donor_id = auth.uid() OR is_admin() OR is_request_owner(request_id));

-- request_replacement_groups: same pattern
DROP POLICY IF EXISTS "Requester manage replacement groups" ON request_replacement_groups;
CREATE POLICY "Requester manage replacement groups" ON request_replacement_groups FOR ALL
  USING (is_request_owner(request_id));

-- request_communities: same pattern
DROP POLICY IF EXISTS "Requester links communities" ON request_communities;
CREATE POLICY "Requester links communities" ON request_communities FOR INSERT
  WITH CHECK (is_request_owner(request_id) AND is_community_member(community_id));
