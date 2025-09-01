-- Clean RLS Policies for Fantasync PWA
-- This version drops ALL existing policies first to ensure a clean slate

-- Step 1: Drop ALL existing policies on all tables
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies on users table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
    
    -- Drop all policies on profiles table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
    
    -- Drop all policies on games table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'games' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON games', pol.policyname);
    END LOOP;
    
    -- Drop all policies on game_players table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'game_players' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON game_players', pol.policyname);
    END LOOP;
    
    -- Drop all policies on game_invitations table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'game_invitations' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON game_invitations', pol.policyname);
    END LOOP;
    
    -- Drop all policies on messages table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON messages', pol.policyname);
    END LOOP;
    
    -- Drop all policies on message_attachments table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'message_attachments' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON message_attachments', pol.policyname);
    END LOOP;
    
    -- Drop all policies on characters table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'characters' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON characters', pol.policyname);
    END LOOP;
    
    -- Drop all policies on friend_relationships table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'friend_relationships' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON friend_relationships', pol.policyname);
    END LOOP;
    
    -- Drop all policies on user_presence table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_presence' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_presence', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Enable RLS on all tables (idempotent - won't error if already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Step 3: Create fresh policies

-- USERS policies
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid()::uuid = id);

CREATE POLICY "users_select_all" ON users
    FOR SELECT USING (true);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid()::uuid = id);

-- GAMES policies
CREATE POLICY "games_insert_own" ON games
    FOR INSERT WITH CHECK (auth.uid()::uuid = master_id);

CREATE POLICY "games_select_participant" ON games
    FOR SELECT USING (
        auth.uid()::uuid = master_id
        OR EXISTS (
            SELECT 1 FROM game_players gp
            WHERE gp.game_id = games.id
            AND gp.user_id = auth.uid()::uuid
            AND gp.is_active = true
        )
    );

CREATE POLICY "games_update_master" ON games
    FOR UPDATE USING (auth.uid()::uuid = master_id);

CREATE POLICY "games_delete_master" ON games
    FOR DELETE USING (auth.uid()::uuid = master_id);

-- GAME_PLAYERS policies (avoiding infinite recursion)
CREATE POLICY "game_players_select" ON game_players
    FOR SELECT USING (
        game_players.user_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM game_players AS gp2
            WHERE gp2.game_id = game_players.game_id
            AND gp2.user_id = auth.uid()::uuid
            AND gp2.is_active = true
        )
    );

CREATE POLICY "game_players_insert" ON game_players
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::uuid
        AND EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            -- Allow joining if game is in preparing status or user is the master
            AND (games.status = 'PREPARING' OR games.master_id = auth.uid()::uuid)
        )
    );

CREATE POLICY "game_players_update_own" ON game_players
    FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "game_players_delete_master" ON game_players
    FOR DELETE USING (
        user_id = auth.uid()::uuid  -- Players can remove themselves
        OR EXISTS (  -- Or masters can remove players
            SELECT 1 FROM games
            WHERE games.id = game_players.game_id
            AND games.master_id = auth.uid()::uuid
        )
    );

-- MESSAGES policies
CREATE POLICY "messages_select_participant" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = messages.game_id
            AND game_players.user_id = auth.uid()::uuid
            AND game_players.is_active = true
        )
    );

CREATE POLICY "messages_insert_participant" ON messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::uuid
        AND EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = messages.game_id
            AND game_players.user_id = auth.uid()::uuid
            AND game_players.is_active = true
        )
    );

CREATE POLICY "messages_update_own" ON messages
    FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "messages_delete_own" ON messages
    FOR DELETE USING (user_id = auth.uid()::uuid);

-- GAME_INVITATIONS policies
CREATE POLICY "invitations_insert_master" ON game_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND games.master_id = auth.uid()::uuid
        )
    );

CREATE POLICY "invitations_select_active" ON game_invitations
    FOR SELECT USING (
        is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );

CREATE POLICY "invitations_update_master" ON game_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_invitations.game_id
            AND games.master_id = auth.uid()::uuid
        )
    );

CREATE POLICY "invitations_delete_master" ON game_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_invitations.game_id
            AND games.master_id = auth.uid()::uuid
        )
    );

-- PROFILES policies (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        CREATE POLICY "profiles_select_all" ON profiles
            FOR SELECT USING (true);
        
        CREATE POLICY "profiles_update_own" ON profiles
            FOR UPDATE USING (user_id = auth.uid()::uuid);
    END IF;
END $$;

-- CHARACTERS policies
CREATE POLICY "characters_select_participant" ON characters
    FOR SELECT USING (
        player_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = characters.game_id
            AND game_players.user_id = auth.uid()::uuid
            AND game_players.is_active = true
        )
    );

CREATE POLICY "characters_insert_own" ON characters
    FOR INSERT WITH CHECK (
        player_id = auth.uid()::uuid
        AND EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = characters.game_id
            AND game_players.user_id = auth.uid()::uuid
            AND game_players.is_active = true
        )
    );

CREATE POLICY "characters_update_own" ON characters
    FOR UPDATE USING (player_id = auth.uid()::uuid);

CREATE POLICY "characters_delete_own" ON characters
    FOR DELETE USING (player_id = auth.uid()::uuid);

-- Verification query - this should return your user if policies are working
SELECT auth.uid() as current_user_id;