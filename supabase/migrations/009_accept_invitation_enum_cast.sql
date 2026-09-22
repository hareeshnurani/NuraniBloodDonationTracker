-- Fix accept_invitation: CASE branches must cast to enum types (PostgreSQL 14+ strictness).

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
      status = (CASE
        WHEN units_filled + 1 >= units_needed THEN 'fulfilled'::request_status
        ELSE 'partially_filled'::request_status
      END),
      closure_type = (CASE
        WHEN units_filled + 1 >= units_needed THEN 'auto_fulfilled'::closure_type
        ELSE closure_type
      END)
  WHERE id = v_request.id
  RETURNING * INTO v_request;

  INSERT INTO chat_threads (request_id, requester_id, donor_id)
  VALUES (v_request.id, v_request.requester_id, p_donor_id)
  ON CONFLICT (request_id, donor_id) DO NOTHING
  RETURNING id INTO v_thread_id;

  IF v_thread_id IS NULL THEN
    SELECT id INTO v_thread_id FROM chat_threads
    WHERE request_id = v_request.id AND donor_id = p_donor_id;
  END IF;

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
