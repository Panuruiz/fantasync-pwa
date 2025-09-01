-- Fix User Sync Between auth.users and public.users
-- This fixes "Key is not present in table users" error

-- Step 1: First, let's check if your user exists in public.users
SELECT 
    'Auth User' as source,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
WHERE au.email = 'pablo@alm.sh'

UNION ALL

SELECT 
    'Public User' as source,
    u.id,
    u.email,
    u.created_at
FROM public.users u
WHERE u.email = 'pablo@alm.sh';

-- Step 2: Manually insert existing auth users into public.users if they don't exist
INSERT INTO public.users (id, email, username, theme, font_size, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)) as username,
    'SYSTEM' as theme,
    'MEDIUM' as font_size,
    au.created_at,
    au.created_at as updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        username,
        avatar_url,
        theme,
        font_size,
        created_at,
        updated_at
    ) VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        'SYSTEM',
        'MEDIUM',
        new.created_at,
        new.created_at
    );
    
    -- Also create a profile for the user
    INSERT INTO public.profiles (
        id,
        user_id,
        bio,
        preferences,
        timezone,
        privacy,
        notifications,
        display
    ) VALUES (
        uuid_generate_v4(),
        new.id,
        null,
        '{}',
        'UTC',
        '{"profileVisibility":"public","showOnlineStatus":true,"allowFriendRequests":true,"showGameHistory":true,"allowDirectMessages":true}',
        '{"email":{"gameInvites":true,"friendRequests":true,"messages":true,"gameUpdates":true,"weeklyDigest":false},"push":{"enabled":false,"gameActivity":true,"mentions":true,"friendsOnline":false}}',
        '{"compactMode":false,"showAvatars":true,"animationsEnabled":true,"highContrast":false}'
    );
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger for new auth user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Create a function to handle user updates (email, metadata changes)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger AS $$
BEGIN
    UPDATE public.users
    SET 
        email = new.email,
        username = COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        avatar_url = new.raw_user_meta_data->>'avatar_url',
        updated_at = now()
    WHERE id = new.id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger for auth user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
    EXECUTE FUNCTION public.handle_user_update();

-- Step 7: Fix any missing defaults on users table
ALTER TABLE public.users
    ALTER COLUMN theme SET DEFAULT 'SYSTEM',
    ALTER COLUMN font_size SET DEFAULT 'MEDIUM',
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET DEFAULT now();

-- Step 8: Ensure profiles table has defaults
ALTER TABLE public.profiles
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ALTER COLUMN preferences SET DEFAULT '{}',
    ALTER COLUMN timezone SET DEFAULT 'UTC',
    ALTER COLUMN privacy SET DEFAULT '{"profileVisibility":"public","showOnlineStatus":true,"allowFriendRequests":true,"showGameHistory":true,"allowDirectMessages":true}',
    ALTER COLUMN notifications SET DEFAULT '{"email":{"gameInvites":true,"friendRequests":true,"messages":true,"gameUpdates":true,"weeklyDigest":false},"push":{"enabled":false,"gameActivity":true,"mentions":true,"friendsOnline":false}}',
    ALTER COLUMN display SET DEFAULT '{"compactMode":false,"showAvatars":true,"animationsEnabled":true,"highContrast":false}';

-- Step 9: Verify your user now exists in public.users
SELECT 
    u.id,
    u.email,
    u.username,
    u.created_at,
    p.id as profile_id
FROM public.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'pablo@alm.sh';

-- Step 10: Test creating a game with your user
/*
-- Get your user ID
SELECT id FROM public.users WHERE email = 'pablo@alm.sh';

-- Try creating a game with that user ID (replace YOUR_USER_ID with the actual ID)
INSERT INTO games (
    master_id,
    name,
    description
) VALUES (
    'YOUR_USER_ID'::uuid,  -- Replace with your actual user ID
    'Test Game After User Sync',
    'This should work now that user exists in public.users'
) RETURNING *;
*/

-- Step 11: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;