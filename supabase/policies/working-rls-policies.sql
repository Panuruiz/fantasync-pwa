-- Working RLS Policies for Fantasync PWA
-- Apply these policies after ensuring the database schema is synced with Prisma
-- Run: npx prisma db push (if not already done)

-- Step 1: Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Step 3: Users table policies
CREATE POLICY "users_select_self" ON users
    FOR SELECT USING (auth.uid()::uuid = id);

CREATE POLICY "users_update_self" ON users
    FOR UPDATE USING (auth.uid()::uuid = id);

-- Step 4: Games table policies
CREATE POLICY "games_insert_authenticated" ON games
    FOR INSERT WITH CHECK (auth.uid()::uuid = master_id);

CREATE POLICY "games_select_participant" ON games
    FOR SELECT USING (
        auth.uid()::uuid = master_id
        OR EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = games.id
            AND game_players.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "games_update_master" ON games
    FOR UPDATE USING (auth.uid()::uuid = master_id);

CREATE POLICY "games_delete_master" ON games
    FOR DELETE USING (auth.uid()::uuid = master_id);

-- Step 5: Game Players table policies (simplified to avoid recursion)
CREATE POLICY "game_players_insert_master_or_self" ON game_players
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::uuid
        AND EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_players.game_id
            AND (
                games.master_id = auth.uid()::uuid
                OR games.privacy = 'PUBLIC'
                OR EXISTS (
                    SELECT 1 FROM game_invitations
                    WHERE game_invitations.game_id = games.id
                    AND game_invitations.invited_user_id = auth.uid()::uuid
                    AND game_invitations.status = 'PENDING'
                )
            )
        )
    );

-- Simplified SELECT policy to avoid recursion
CREATE POLICY "game_players_select_own" ON game_players
    FOR SELECT USING (
        user_id = auth.uid()::uuid
        OR game_id IN (
            SELECT id FROM games WHERE master_id = auth.uid()::uuid
        )
        OR game_id IN (
            SELECT game_id FROM game_players gp WHERE gp.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "game_players_update_self" ON game_players
    FOR UPDATE USING (
        user_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_players.game_id
            AND games.master_id = auth.uid()::uuid
        )
    );

CREATE POLICY "game_players_delete_self_or_master" ON game_players
    FOR DELETE USING (
        user_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_players.game_id
            AND games.master_id = auth.uid()::uuid
        )
    );

-- Step 6: Messages table policies
CREATE POLICY "messages_insert_participant" ON messages
    FOR INSERT WITH CHECK (
        author_id = auth.uid()::uuid
        AND EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = messages.game_id
            AND game_players.user_id = auth.uid()::uuid
            AND game_players.is_active = true
        )
    );

CREATE POLICY "messages_select_participant" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = messages.game_id
            AND game_players.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "messages_update_author" ON messages
    FOR UPDATE USING (author_id = auth.uid()::uuid);

CREATE POLICY "messages_delete_author_or_master" ON messages
    FOR DELETE USING (
        author_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM games
            WHERE games.id = messages.game_id
            AND games.master_id = auth.uid()::uuid
        )
    );

-- Step 7: Game Invitations policies
CREATE POLICY "invitations_insert_master" ON game_invitations
    FOR INSERT WITH CHECK (
        invited_by_id = auth.uid()::uuid
        AND EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_invitations.game_id
            AND games.master_id = auth.uid()::uuid
        )
    );

CREATE POLICY "invitations_select_related" ON game_invitations
    FOR SELECT USING (
        invited_by_id = auth.uid()::uuid
        OR invited_user_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_invitations.game_id
            AND games.master_id = auth.uid()::uuid
        )
    );

CREATE POLICY "invitations_update_related" ON game_invitations
    FOR UPDATE USING (
        invited_user_id = auth.uid()::uuid
        OR invited_by_id = auth.uid()::uuid
    );

CREATE POLICY "invitations_delete_master" ON game_invitations
    FOR DELETE USING (
        invited_by_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_invitations.game_id
            AND games.master_id = auth.uid()::uuid
        )
    );

-- Step 8: Profiles policies
CREATE POLICY "profiles_insert_self" ON profiles
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "profiles_select_self" ON profiles
    FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "profiles_update_self" ON profiles
    FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "profiles_delete_self" ON profiles
    FOR DELETE USING (user_id = auth.uid()::uuid);

-- Step 9: Characters policies
CREATE POLICY "characters_insert_player" ON characters
    FOR INSERT WITH CHECK (
        player_id = auth.uid()::uuid
        AND EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = characters.game_id
            AND game_players.user_id = auth.uid()::uuid
            AND game_players.is_active = true
        )
    );

CREATE POLICY "characters_select_participant" ON characters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = characters.game_id
            AND game_players.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "characters_update_owner" ON characters
    FOR UPDATE USING (player_id = auth.uid()::uuid);

CREATE POLICY "characters_delete_owner" ON characters
    FOR DELETE USING (player_id = auth.uid()::uuid);

-- Step 10: Friend Relationships policies
CREATE POLICY "friends_insert_self" ON friend_relationships
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "friends_select_related" ON friend_relationships
    FOR SELECT USING (
        user_id = auth.uid()::uuid
        OR friend_id = auth.uid()::uuid
    );

CREATE POLICY "friends_update_related" ON friend_relationships
    FOR UPDATE USING (
        user_id = auth.uid()::uuid
        OR friend_id = auth.uid()::uuid
    );

CREATE POLICY "friends_delete_self" ON friend_relationships
    FOR DELETE USING (user_id = auth.uid()::uuid);

-- Step 11: User Presence policies
CREATE POLICY "presence_insert_self" ON user_presence
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "presence_select_all" ON user_presence
    FOR SELECT USING (true);  -- Everyone can see presence

CREATE POLICY "presence_update_self" ON user_presence
    FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "presence_delete_self" ON user_presence
    FOR DELETE USING (user_id = auth.uid()::uuid);

-- Step 12: Message Attachments policies
CREATE POLICY "attachments_insert_author" ON message_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = message_attachments.message_id
            AND messages.author_id = auth.uid()::uuid
        )
    );

CREATE POLICY "attachments_select_participant" ON message_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN game_players gp ON gp.game_id = m.game_id
            WHERE m.id = message_attachments.message_id
            AND gp.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "attachments_delete_author" ON message_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = message_attachments.message_id
            AND messages.author_id = auth.uid()::uuid
        )
    );

-- Step 13: Verify the policies are applied
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual IS NOT NULL as has_using,
    with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;