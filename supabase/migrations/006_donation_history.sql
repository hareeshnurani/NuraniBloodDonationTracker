-- Donation history: reason when not donated, prompt on accept

ALTER TABLE donation_confirmations
  ADD COLUMN IF NOT EXISTS not_donated_reason TEXT;
