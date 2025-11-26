-- Create admin profile for clive.hays@cloverera.com
-- Using the ACTUAL user ID from auth.users (from the screenshot)

-- First, check if profile already exists and delete it if needed
DELETE FROM public.profiles WHERE id = '3bd08db0-4889-4400-b07b-ede7a6ee9102';

-- Now insert the admin profile
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
    '3bd08db0-4889-4400-b07b-ede7a6ee9102',
    'clive.hays@cloverera.com',
    'Clive Hays',
    'admin',
    NOW(),
    NOW()
);

-- Verify the profile was created
SELECT
    id,
    email,
    role,
    created_at
FROM public.profiles
WHERE id = '3bd08db0-4889-4400-b07b-ede7a6ee9102';
