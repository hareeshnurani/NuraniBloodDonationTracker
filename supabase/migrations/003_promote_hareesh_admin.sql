-- Make Hareesh NV the first admin (run once in Supabase SQL Editor)

UPDATE profiles
SET role = 'admin', status = 'active'
WHERE email = 'hareesh.nurani96@gmail.com';
