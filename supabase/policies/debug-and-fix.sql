-- Step 1: Debug - Check what columns actually exist in game_players
SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM 
    information_schema.columns c
WHERE 
    c.table_schema = 'public' 
    AND c.table_name = 'game_players'
ORDER BY 
    c.ordinal_position;

-- Step 2: Check if the table exists and has data
SELECT COUNT(*) as table_exists FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'game_players';

-- Step 3: If user_id doesn't exist, check for alternative column names
-- Common alternatives: userId, player_id, playerId

-- Step 4: Apply this simplified policy that should work regardless
-- This version uses direct column references without subqueries first
DROP POLICY IF EXISTS "Users can view players in their games" ON game_players;

-- Try the simplest possible policy first
CREATE POLICY "Users can view players in their games" ON game_players
    FOR SELECT USING (true);  -- Temporarily allow all reads to test

-- Step 5: Once we confirm the table structure, apply the proper policy
-- Replace 'user_id' with the actual column name from Step 1
/*
CREATE POLICY "Users can view players in their games" ON game_players
    FOR SELECT USING (
        -- Replace COLUMN_NAME with actual column from Step 1
        COLUMN_NAME = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM game_players AS gp2
            WHERE gp2.game_id = game_players.game_id
            AND gp2.COLUMN_NAME = auth.uid()::uuid  -- Replace COLUMN_NAME
            AND gp2.is_active = true
        )
    );
*/