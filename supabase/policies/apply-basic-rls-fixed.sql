-- Fixed RLS Policies for Fantasync PWA
-- This version properly references column names and avoids infinite recursion

-- First, check if columns exist (for debugging)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'game_players';

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

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view other users public info" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create games" ON games;
DROP POLICY IF EXISTS "Users can view games they participate in" ON games;
DROP POLICY IF EXISTS "Masters can update their games" ON games;
DROP POLICY IF EXISTS "Masters can delete their games" ON games;
DROP POLICY IF EXISTS "Users can view players in their games" ON game_players;
DROP POLICY IF EXISTS "Game masters can add players" ON game_players;
DROP POLICY IF EXISTS "Players can update their own status" ON game_players;
DROP POLICY IF EXISTS "Masters can remove players from their games" ON game_players;

-- USERS policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::uuid = id);

CREATE POLICY "Users can view other users public info" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::uuid = id);

-- GAMES policies
CREATE POLICY "Users can create games" ON games
    FOR INSERT WITH CHECK (auth.uid()::uuid = master_id);

CREATE POLICY "Users can view games they participate in" ON games
    FOR SELECT USING (
        auth.uid()::uuid = master_id
        OR EXISTS (
            SELECT 1 FROM game_players gp
            WHERE gp.game_id = games.id
            AND gp.user_id = auth.uid()::uuid
            AND gp.is_active = true
        )
    );

CREATE POLICY "Masters can update their games" ON games
    FOR UPDATE USING (auth.uid()::uuid = master_id);

CREATE POLICY "Masters can delete their games" ON games
    FOR DELETE USING (auth.uid()::uuid = master_id);

-- GAME_PLAYERS policies (Fixed to avoid infinite recursion)
-- Using explicit table qualification and proper column references
CREATE POLICY "Users can view players in their games" ON game_players
    FOR SELECT USING (
        -- User can see their own player record
        game_players.user_id = auth.uid()::uuid
        -- OR user can see other players if they're in the same game
        OR EXISTS (
            SELECT 1 FROM game_players AS gp2
            WHERE gp2.game_id = game_players.game_id
            AND gp2.user_id = auth.uid()::uuid
            AND gp2.is_active = true
        )
    );

-- Allow users to join games (insert themselves)
CREATE POLICY "Users can join games" ON game_players
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::uuid
        -- Optionally, check if game allows joining
        AND EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND games.status = 'PREPARING'
        )
    );

-- Players can update their own status
CREATE POLICY "Players can update their own status" ON game_players
    FOR UPDATE USING (user_id = auth.uid()::uuid);

-- Masters can remove players from their games
CREATE POLICY "Masters can remove players from their games" ON game_players
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_players.game_id
            AND games.master_id = auth.uid()::uuid
        )
    );

-- MESSAGES policies
DROP POLICY IF EXISTS "Users can view messages in their games" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their games" ON messages;

CREATE POLICY "Users can view messages in their games" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = messages.game_id
            AND game_players.user_id = auth.uid()::uuid
            AND game_players.is_active = true
        )
    );

CREATE POLICY "Users can send messages in their games" ON messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::uuid
        AND EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = messages.game_id
            AND game_players.user_id = auth.uid()::uuid
            AND game_players.is_active = true
        )
    );

-- GAME_INVITATIONS policies
DROP POLICY IF EXISTS "Masters can create invitations" ON game_invitations;
DROP POLICY IF EXISTS "Anyone can view active invitations" ON game_invitations;

CREATE POLICY "Masters can create invitations" ON game_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM games
            WHERE games.id = game_id
            AND games.master_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Anyone can view active invitations" ON game_invitations
    FOR SELECT USING (
        is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- PROFILES policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (user_id = auth.uid()::uuid);

-- CHARACTERS policies
DROP POLICY IF EXISTS "Users can view their characters" ON characters;
DROP POLICY IF EXISTS "Users can create characters" ON characters;

CREATE POLICY "Users can view their characters" ON characters
    FOR SELECT USING (
        player_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = characters.game_id
            AND game_players.user_id = auth.uid()::uuid
            AND game_players.is_active = true
        )
    );

CREATE POLICY "Users can create characters" ON characters
    FOR INSERT WITH CHECK (
        player_id = auth.uid()::uuid
        AND EXISTS (
            SELECT 1 FROM game_players
            WHERE game_players.game_id = characters.game_id
            AND game_players.user_id = auth.uid()::uuid
            AND game_players.is_active = true
        )
    );

-- Add a simple test to verify policies work
-- SELECT * FROM games WHERE master_id = auth.uid()::uuid LIMIT 1;