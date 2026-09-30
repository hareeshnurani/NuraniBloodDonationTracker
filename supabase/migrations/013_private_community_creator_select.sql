-- Private community creation failed with:
--   new row violates row-level security policy for table "communities"
-- PostgREST INSERT ... RETURNING runs SELECT; private rows were invisible until
-- the founder joined community_members (public rows were visible via visibility = 'public').

CREATE POLICY "Creators view own communities" ON communities FOR SELECT
  USING (creator_id = auth.uid());
