-- Fantasync PWA RLS Policies
-- This file contains all Row Level Security policies for the application
-- Apply these policies after running Prisma migrations

-- Enable RLS on all tables
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

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can view other users' public information (for friend lists, game players, etc.)
CREATE POLICY "Users can view other users public info" ON users
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- ========================================
-- PROFILES TABLE POLICIES
-- ========================================

-- Users can view their own profile details
CREATE POLICY "Users can view own profile details" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view other profiles based on privacy settings
CREATE POLICY "Users can view public profiles" ON profiles
    FOR SELECT USING (
        (privacy->>'profileVisibility')::text = 'public'
        OR auth.uid() = user_id
    );

-- Users can update their own profile details
CREATE POLICY "Users can update own profile details" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- GAMES TABLE POLICIES
-- ========================================

-- Users can view games they are part of (as master or player)
CREATE POLICY "Users can view games they participate in" ON games
    FOR SELECT USING (
        auth.uid() = master_id
        OR EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = games.id
            AND game_players.user_id = auth.uid()
            AND game_players.is_active = true
        )
    );

-- Users can create games (becoming the master)
CREATE POLICY "Users can create games" ON games
    FOR INSERT WITH CHECK (auth.uid() = master_id);

-- Only game masters can update their games
CREATE POLICY "Masters can update their games" ON games
    FOR UPDATE USING (auth.uid() = master_id);

-- Only game masters can delete their games
CREATE POLICY "Masters can delete their games" ON games
    FOR DELETE USING (auth.uid() = master_id);

-- ========================================
-- GAME_PLAYERS TABLE POLICIES
-- ========================================

-- Users can view players in games they participate in
CREATE POLICY "Users can view players in their games" ON game_players
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_players.game_id
            AND (
                games.master_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM game_players gp2
                    WHERE gp2.game_id = games.id
                    AND gp2.user_id = auth.uid()
                    AND gp2.is_active = true
                )
            )
        )
    );

-- Users can join games (insert themselves as players)
CREATE POLICY "Users can join games" ON game_players
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND games.master_id = auth.uid()
        )
    );

-- Users can leave games (delete their own participation)
CREATE POLICY "Users can leave games" ON game_players
    FOR DELETE USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND games.master_id = auth.uid()
        )
    );

-- Masters can update player status in their games
CREATE POLICY "Masters can update players in their games" ON game_players
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND games.master_id = auth.uid()
        )
    );

-- ========================================
-- GAME_INVITATIONS TABLE POLICIES
-- ========================================

-- Users can view invitations they sent or received
CREATE POLICY "Users can view own invitations" ON game_invitations
    FOR SELECT USING (
        auth.uid() = invited_by_id
        OR auth.uid() = invited_user_id
        OR (
            -- Can also view public link invitations for games they're a master of
            type = 'LINK' AND EXISTS (
                SELECT 1 FROM games
                WHERE games.id = game_id
                AND games.master_id = auth.uid()
            )
        )
    );

-- Users can create invitations for games they master
CREATE POLICY "Masters can create invitations" ON game_invitations
    FOR INSERT WITH CHECK (
        auth.uid() = invited_by_id
        AND EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND games.master_id = auth.uid()
        )
    );

-- Users can update invitations they sent or received
CREATE POLICY "Users can update own invitations" ON game_invitations
    FOR UPDATE USING (
        auth.uid() = invited_by_id
        OR auth.uid() = invited_user_id
    );

-- Masters can delete invitations for their games
CREATE POLICY "Masters can delete invitations" ON game_invitations
    FOR DELETE USING (
        auth.uid() = invited_by_id
        OR EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND games.master_id = auth.uid()
        )
    );

-- ========================================
-- MESSAGES TABLE POLICIES
-- ========================================

-- Users can view messages in games they participate in
CREATE POLICY "Users can view messages in their games" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND (
                games.master_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM game_players
                    WHERE game_players.game_id = games.id
                    AND game_players.user_id = auth.uid()
                    AND game_players.is_active = true
                )
            )
        )
    );

-- Users can send messages in games they participate in
CREATE POLICY "Users can send messages in their games" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND (
                games.master_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM game_players
                    WHERE game_players.game_id = games.id
                    AND game_players.user_id = auth.uid()
                    AND game_players.is_active = true
                )
            )
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (auth.uid() = author_id);

-- Users can delete their own messages, masters can delete any message in their games
CREATE POLICY "Users can delete messages" ON messages
    FOR DELETE USING (
        auth.uid() = author_id
        OR EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND games.master_id = auth.uid()
        )
    );

-- ========================================
-- MESSAGE_ATTACHMENTS TABLE POLICIES
-- ========================================

-- Users can view attachments in messages they can see
CREATE POLICY "Users can view attachments" ON message_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages
            JOIN games ON games.id = messages.game_id
            WHERE messages.id = message_id
            AND (
                games.master_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM game_players
                    WHERE game_players.game_id = games.id
                    AND game_players.user_id = auth.uid()
                    AND game_players.is_active = true
                )
            )
        )
    );

-- Users can add attachments to their own messages
CREATE POLICY "Users can add attachments" ON message_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = message_id
            AND messages.author_id = auth.uid()
        )
    );

-- Users can delete attachments from their own messages
CREATE POLICY "Users can delete attachments" ON message_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = message_id
            AND messages.author_id = auth.uid()
        )
    );

-- ========================================
-- CHARACTERS TABLE POLICIES
-- ========================================

-- Users can view characters in games they participate in
CREATE POLICY "Users can view characters in their games" ON characters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND (
                games.master_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM game_players
                    WHERE game_players.game_id = games.id
                    AND game_players.user_id = auth.uid()
                    AND game_players.is_active = true
                )
            )
        )
    );

-- Users can create their own characters
CREATE POLICY "Users can create own characters" ON characters
    FOR INSERT WITH CHECK (
        auth.uid() = player_id
        AND EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = game_id
            AND game_players.user_id = auth.uid()
            AND game_players.is_active = true
        )
    );

-- Users can update their own characters
CREATE POLICY "Users can update own characters" ON characters
    FOR UPDATE USING (
        auth.uid() = player_id
        OR EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND games.master_id = auth.uid()
        )
    );

-- Users can delete their own characters
CREATE POLICY "Users can delete own characters" ON characters
    FOR DELETE USING (
        auth.uid() = player_id
        OR EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND games.master_id = auth.uid()
        )
    );

-- ========================================
-- FRIEND_RELATIONSHIPS TABLE POLICIES
-- ========================================

-- Users can view their own friend relationships
CREATE POLICY "Users can view own friendships" ON friend_relationships
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.uid() = friend_id
    );

-- Users can create friend requests
CREATE POLICY "Users can create friend requests" ON friend_relationships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their friend relationships
CREATE POLICY "Users can update friendships" ON friend_relationships
    FOR UPDATE USING (
        auth.uid() = user_id
        OR auth.uid() = friend_id
    );

-- Users can delete their friend relationships
CREATE POLICY "Users can delete friendships" ON friend_relationships
    FOR DELETE USING (
        auth.uid() = user_id
        OR auth.uid() = friend_id
    );

-- ========================================
-- USER_PRESENCE TABLE POLICIES
-- ========================================

-- Users can view presence of their friends and game participants
CREATE POLICY "Users can view presence" ON user_presence
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM friend_relationships
            WHERE (friend_relationships.user_id = auth.uid() AND friend_relationships.friend_id = user_presence.user_id)
            OR (friend_relationships.friend_id = auth.uid() AND friend_relationships.user_id = user_presence.user_id)
            AND friend_relationships.status = 'ACCEPTED'
        )
        OR EXISTS (
            SELECT 1 FROM game_players gp1
            JOIN game_players gp2 ON gp1.game_id = gp2.game_id
            WHERE gp1.user_id = auth.uid()
            AND gp2.user_id = user_presence.user_id
            AND gp1.is_active = true
            AND gp2.is_active = true
        )
    );

-- Users can update their own presence
CREATE POLICY "Users can update own presence" ON user_presence
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence" ON user_presence
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own presence
CREATE POLICY "Users can delete own presence" ON user_presence
    FOR DELETE USING (auth.uid() = user_id);