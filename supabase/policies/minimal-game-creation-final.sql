-- MINIMAL RLS for Game Creation - Start Here!
-- This is the absolute minimum to get game creation working
-- No circular dependencies, no recursion

-- Step 1: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies on these tables
DROP POLICY IF EXISTS "users_select_self" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;
DROP POLICY IF EXISTS "games_insert_authenticated" ON games;
DROP POLICY IF EXISTS "games_select_own_or_public" ON games;
DROP POLICY IF EXISTS "games_select_participant" ON games;
DROP POLICY IF EXISTS "games_update_master" ON games;
DROP POLICY IF EXISTS "games_delete_master" ON games;
DROP POLICY IF EXISTS "game_players_insert_master_or_self" ON game_players;
DROP POLICY IF EXISTS "game_players_select_participant" ON game_players;
DROP POLICY IF EXISTS "game_players_update_self_or_master" ON game_players;
DROP POLICY IF EXISTS "game_players_delete_self_or_master" ON game_players;

-- Step 3: Users - Basic policies
CREATE POLICY "users_select" ON users
    FOR SELECT USING (true);  -- Allow seeing all users (for game display)

CREATE POLICY "users_update_self" ON users
    FOR UPDATE USING (auth.uid()::uuid = id);

-- Step 4: Games - Simple policies without game_players reference
CREATE POLICY "games_insert" ON games
    FOR INSERT WITH CHECK (auth.uid()::uuid = master_id);

CREATE POLICY "games_select" ON games
    FOR SELECT USING (true);  -- Temporarily allow all to see games

CREATE POLICY "games_update" ON games
    FOR UPDATE USING (auth.uid()::uuid = master_id);

CREATE POLICY "games_delete" ON games
    FOR DELETE USING (auth.uid()::uuid = master_id);

-- Step 5: Game Players - Can reference games safely
CREATE POLICY "game_players_insert" ON game_players
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::uuid
    );

CREATE POLICY "game_players_select" ON game_players
    FOR SELECT USING (true);  -- Temporarily allow all to see players

CREATE POLICY "game_players_update" ON game_players
    FOR UPDATE USING (
        user_id = auth.uid()::uuid
    );

CREATE POLICY "game_players_delete" ON game_players
    FOR DELETE USING (
        user_id = auth.uid()::uuid
    );

-- Step 6: Verify
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'games', 'game_players')
ORDER BY tablename, policyname;