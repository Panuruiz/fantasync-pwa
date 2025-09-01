-- Fix UUID Generation and Apply Minimal RLS Policies
-- This fixes the "null value in column id" error

-- Step 1: Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Fix the games table to auto-generate UUIDs
ALTER TABLE games 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Step 3: Also fix other tables that might have the same issue
ALTER TABLE game_players 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

ALTER TABLE game_invitations 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

ALTER TABLE messages 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

ALTER TABLE message_attachments 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

ALTER TABLE characters 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

ALTER TABLE friend_relationships 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Step 4: Verify the default is set
SELECT 
    table_name,
    column_name,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name = 'id'
    AND table_name IN ('games', 'game_players', 'game_invitations', 'messages', 'characters')
ORDER BY table_name;

-- Step 5: Enable RLS (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop ALL existing policies to start completely fresh
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'games', 'game_players')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Step 7: Create minimal working policies
-- Users
CREATE POLICY "allow_select_users" ON users
    FOR SELECT USING (true);

CREATE POLICY "allow_update_own_user" ON users
    FOR UPDATE USING (auth.uid()::uuid = id);

-- Games
CREATE POLICY "allow_insert_games" ON games
    FOR INSERT WITH CHECK (auth.uid()::uuid = master_id);

CREATE POLICY "allow_select_games" ON games
    FOR SELECT USING (true);

CREATE POLICY "allow_update_own_games" ON games
    FOR UPDATE USING (auth.uid()::uuid = master_id);

CREATE POLICY "allow_delete_own_games" ON games
    FOR DELETE USING (auth.uid()::uuid = master_id);

-- Game Players
CREATE POLICY "allow_insert_game_players" ON game_players
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "allow_select_game_players" ON game_players
    FOR SELECT USING (true);

CREATE POLICY "allow_update_own_game_players" ON game_players
    FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "allow_delete_own_game_players" ON game_players
    FOR DELETE USING (user_id = auth.uid()::uuid);

-- Step 8: Test by creating a game (uncomment and modify as needed)
/*
-- First check your user ID
SELECT auth.uid() as my_user_id;

-- Try creating a game
INSERT INTO games (
    master_id,
    name,
    description,
    system,
    privacy,
    max_players,
    status
) VALUES (
    auth.uid()::uuid,
    'Test Game with Auto ID',
    'Testing UUID generation',
    'DND5E',
    'PRIVATE',
    4,
    'PREPARING'
) RETURNING id, name;
*/

-- Step 9: Verify policies are applied
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'games', 'game_players')
ORDER BY tablename, policyname;