-- Complete Fix for Games Table - All Defaults and Triggers
-- This fixes all "null value" constraint violations

-- Step 1: Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Fix ALL default values for the games table
ALTER TABLE games 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET DEFAULT now(),
    ALTER COLUMN current_session SET DEFAULT 0,
    ALTER COLUMN max_players SET DEFAULT 4,
    ALTER COLUMN status SET DEFAULT 'PREPARING',
    ALTER COLUMN privacy SET DEFAULT 'PRIVATE',
    ALTER COLUMN system SET DEFAULT 'DND5E',
    ALTER COLUMN settings SET DEFAULT '{}';

-- Step 3: Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 4: Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Fix defaults for game_players table
ALTER TABLE game_players 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ALTER COLUMN joined_at SET DEFAULT now(),
    ALTER COLUMN last_seen_at SET DEFAULT now(),
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN role SET DEFAULT 'PLAYER';

-- Step 6: Fix defaults for other related tables
ALTER TABLE game_invitations 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ALTER COLUMN code SET DEFAULT uuid_generate_v4(),
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN status SET DEFAULT 'PENDING';

ALTER TABLE messages 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN is_edited SET DEFAULT false,
    ALTER COLUMN type SET DEFAULT 'CHAT';

ALTER TABLE characters 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET DEFAULT now(),
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN data SET DEFAULT '{}';

-- Step 7: Add updated_at triggers for other tables that need them
DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
CREATE TRIGGER update_characters_updated_at 
    BEFORE UPDATE ON characters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_presence_updated_at ON user_presence;
CREATE TRIGGER update_user_presence_updated_at 
    BEFORE UPDATE ON user_presence 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Verify the defaults are set correctly
SELECT 
    c.table_name,
    c.column_name,
    c.column_default,
    c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema = 'public'
    AND c.table_name = 'games'
    AND c.column_name IN ('id', 'created_at', 'updated_at', 'status', 'privacy', 'system', 'max_players', 'current_session', 'settings')
ORDER BY c.ordinal_position;

-- Step 9: Apply the minimal RLS policies (from previous fix)
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on these tables
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

-- Create minimal working policies
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

-- Step 10: Test creating a game (uncomment to test)
/*
-- Test that defaults work
INSERT INTO games (
    master_id,
    name,
    description
) VALUES (
    auth.uid()::uuid,
    'Test Game with All Defaults',
    'All columns should have proper defaults now'
) RETURNING *;
*/

-- Step 11: Show all triggers on games table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
    AND event_object_table = 'games';

-- Step 12: Final verification
SELECT 
    'Games table is ready!' as status,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'games';