-- Diagnostic: Check actual database structure
-- Run this FIRST to see what's actually in the database

-- 1. Check if game_players table exists and show its columns
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

-- 2. Check all tables that should exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. If game_players exists but has different columns, it might be using camelCase
-- Common possibilities:
-- - userId (camelCase - if Prisma migration wasn't run)
-- - user_id (snake_case - if Prisma migration was run)
-- - UserId (PascalCase - unlikely but possible)

-- 4. IMPORTANT: If the table doesn't have the expected columns, you need to:
-- Option A: Run Prisma migration to sync the database
--    npx prisma db push
-- Option B: Manually rename columns (if they exist with different names)
--    ALTER TABLE game_players RENAME COLUMN "userId" TO user_id;

-- 5. After confirming column names, use this fixed policy
-- Replace ACTUAL_COLUMN_NAME with the real column from step 1
/*
DROP POLICY IF EXISTS "game_players_select" ON game_players;
CREATE POLICY "game_players_select" ON game_players
    FOR SELECT USING (
        game_players.ACTUAL_COLUMN_NAME = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM game_players AS gp2
            WHERE gp2.game_id = game_players.game_id
            AND gp2.ACTUAL_COLUMN_NAME = auth.uid()::uuid
            AND gp2.is_active = true
        )
    );
*/