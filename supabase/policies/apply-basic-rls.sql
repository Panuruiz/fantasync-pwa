-- Basic RLS Policies for Fantasync PWA
-- This file contains the minimal set of policies needed to get started

-- First, enable RLS on all tables (if not already enabled)
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

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view other users public info" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create games" ON games;
DROP POLICY IF EXISTS "Users can view games they participate in" ON games;
DROP POLICY IF EXISTS "Masters can update their games" ON games;
DROP POLICY IF EXISTS "Masters can delete their games" ON games;
DROP POLICY IF EXISTS "Game masters can add players" ON game_players;
DROP POLICY IF EXISTS "Users can view players in their games" ON game_players;
DROP POLICY IF EXISTS "Players can update own status" ON game_players;
DROP POLICY IF EXISTS "Masters can update players in their games" ON game_players;
DROP POLICY IF EXISTS "Masters can remove players from their games" ON game_players;

-- Essential USERS policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view other users public info" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Essential GAMES policies
CREATE POLICY "Users can create games" ON games
    FOR INSERT WITH CHECK (auth.uid() = master_id);

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

CREATE POLICY "Masters can update their games" ON games
    FOR UPDATE USING (auth.uid() = master_id);

CREATE POLICY "Masters can delete their games" ON games
    FOR DELETE USING (auth.uid() = master_id);

-- Essential GAME_PLAYERS policies
-- Simplified: Users can only see game_players for games where they are a participant
-- This avoids the circular dependency by checking user_id directly
CREATE POLICY "Users can view players in their games" ON game_players
    FOR SELECT USING (
        -- User is in this game (simple direct check)
        auth.uid() = user_id
        -- OR user is in the same game (check other players in same game)
        OR EXISTS (
            SELECT 1 FROM game_players gp2
            WHERE gp2.game_id = game_players.game_id
            AND gp2.user_id = auth.uid()
            AND gp2.is_active = true
        )
    );

-- Masters and players can add themselves to games
CREATE POLICY "Game masters can add players" ON game_players
    FOR INSERT WITH CHECK (
        -- User is adding themselves to a game
        auth.uid() = user_id
        -- OR user is the master of this game (without checking game_players table)
        OR EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_players.game_id
            AND games.master_id = auth.uid()
        )
    );

-- Players can update their own status (e.g., leave game)
CREATE POLICY "Players can update own status" ON game_players
    FOR UPDATE USING (auth.uid() = user_id);

-- Masters can update any player in their games
CREATE POLICY "Masters can update players in their games" ON game_players
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_players.game_id
            AND games.master_id = auth.uid()
        )
    );

-- Masters can remove players from their games
CREATE POLICY "Masters can remove players from their games" ON game_players
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_players.game_id
            AND games.master_id = auth.uid()
        )
    );

-- Essential MESSAGES policies
-- Drop existing message policies
DROP POLICY IF EXISTS "Users can send messages to their games" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their games" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

-- Users can send messages to games they're in
CREATE POLICY "Users can send messages to their games" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = messages.game_id
            AND game_players.user_id = auth.uid()
            AND game_players.is_active = true
        )
    );

-- Users can view messages in games they're in
CREATE POLICY "Users can view messages in their games" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = messages.game_id
            AND game_players.user_id = auth.uid()
            AND game_players.is_active = true
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON messages
    FOR DELETE USING (auth.uid() = user_id);

-- Essential GAME_INVITATIONS policies
-- Drop existing invitation policies
DROP POLICY IF EXISTS "Masters can create invitations" ON game_invitations;
DROP POLICY IF EXISTS "Users can view invitations" ON game_invitations;
DROP POLICY IF EXISTS "Masters can update invitations" ON game_invitations;
DROP POLICY IF EXISTS "Masters can delete invitations" ON game_invitations;

-- Masters can create invitations for their games
CREATE POLICY "Masters can create invitations" ON game_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_invitations.game_id
            AND games.master_id = auth.uid()
        )
    );

-- Users can view invitations (public for joining via code)
CREATE POLICY "Users can view invitations" ON game_invitations
    FOR SELECT USING (true);

-- Masters can update their game invitations
CREATE POLICY "Masters can update invitations" ON game_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_invitations.game_id
            AND games.master_id = auth.uid()
        )
    );

-- Masters can delete their game invitations
CREATE POLICY "Masters can delete invitations" ON game_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_invitations.game_id
            AND games.master_id = auth.uid()
        )
    );

-- Essential PROFILES policies
-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Public profiles are viewable by everyone
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Essential CHARACTERS policies
-- Drop existing character policies
DROP POLICY IF EXISTS "Users can create characters" ON characters;
DROP POLICY IF EXISTS "Users can view characters in their games" ON characters;
DROP POLICY IF EXISTS "Users can update own characters" ON characters;
DROP POLICY IF EXISTS "Users can delete own characters" ON characters;

-- Users can create characters for games they're in
CREATE POLICY "Users can create characters" ON characters
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = characters.game_id
            AND game_players.user_id = auth.uid()
            AND game_players.is_active = true
        )
    );

-- Users can view all characters in games they're in
CREATE POLICY "Users can view characters in their games" ON characters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = characters.game_id
            AND game_players.user_id = auth.uid()
            AND game_players.is_active = true
        )
    );

-- Users can update their own characters
CREATE POLICY "Users can update own characters" ON characters
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own characters
CREATE POLICY "Users can delete own characters" ON characters
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;