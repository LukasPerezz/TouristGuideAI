-- Set lukitas.p.11@gmail.com as admin
-- This script should be run after the user has signed up
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'lukitas.p.11@gmail.com';

-- If the user hasn't signed up yet, insert a placeholder
INSERT INTO user_profiles (id, email, role)
SELECT gen_random_uuid(), 'lukitas.p.11@gmail.com', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE email = 'lukitas.p.11@gmail.com'
);
