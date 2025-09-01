-- Minimal RLS Setup for Game Creation
-- This is the absolute minimum needed to create games

-- Step 1: Enable RLS (safe to run multiple times)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any conflicting policies
DROP POLICY IF EXISTS "Users can create games" ON games;
DROP POLICY IF EXISTS "games_insert_own" ON games;
DROP POLICY IF EXISTS "Users can view games they participate in" ON games;
DROP POLICY IF EXISTS "games_select_participant" ON games;
DROP POLICY IF EXISTS "Masters can update their games" ON games;
DROP POLICY IF EXISTS "games_update_master" ON games;

DROP POLICY IF EXISTS "Users can join games" ON game_players;
DROP POLICY IF EXISTS "game_players_insert" ON game_players;
DROP POLICY IF EXISTS "Game masters can add players" ON game_players;
DROP POLICY IF EXISTS "Users can view players in their games" ON game_players;
DROP POLICY IF EXISTS "game_players_select" ON game_players;

-- Step 3: Create minimal working policies

-- Allow authenticated users to create games
CREATE POLICY "allow_game_creation" ON games
    FOR INSERT 
    WITH CHECK (auth.uid()::uuid = master_id);

-- Allow users to view games where they are the master
CREATE POLICY "view_own_games" ON games
    FOR SELECT 
    USING (auth.uid()::uuid = master_id);

-- Allow masters to update their games
CREATE POLICY "update_own_games" ON games
    FOR UPDATE 
    USING (auth.uid()::uuid = master_id);

-- Allow game masters to add themselves as the first player
CREATE POLICY "master_join_game" ON game_players
    FOR INSERT 
    WITH CHECK (
        user_id = auth.uid()::uuid
        AND EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = game_id 
            AND games.master_id = auth.uid()::uuid
        )
    );

-- Allow users to see game_players for games they created
CREATE POLICY "view_game_players" ON game_players
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = game_players.game_id 
            AND games.master_id = auth.uid()::uuid
        )
    );

-- Test query - should return your user ID if auth is working
SELECT auth.uid() as your_user_id;

-- Test creating a game (replace values as needed)
/*
INSERT INTO games (
    id,
    master_id,
    name,
    description,
    system,
    status,
    max_players,
    is_private
) VALUES (
    gen_random_uuid(),
    auth.uid()::uuid,
    'Test Game',
    'Testing RLS policies',
    'DND5E',
    'PREPARING',
    6,
    false
);
*/