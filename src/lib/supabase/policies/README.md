# Row Level Security (RLS) Policies

This directory contains SQL files that define Row Level Security policies for the Fantasync PWA database tables. These policies enforce data access control at the database level, ensuring users can only access data they're authorized to see.

## Policy Implementation Guide

### 1. Core User Policies

**File**: `01_users_policies.sql`

```sql
-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 2. Profile Policies

**File**: `02_profiles_policies.sql`

```sql
-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can manage their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public profiles are viewable by everyone (if user opts in)
CREATE POLICY "Public profiles viewable" ON public.profiles
  FOR SELECT USING (
    (preferences->>'isPublic')::boolean = true
  );
```

### 3. Game Policies

**File**: `03_games_policies.sql`

```sql
-- Enable RLS on games table
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Game masters can manage their own games
CREATE POLICY "Masters can manage own games" ON public.games
  FOR ALL USING (auth.uid() = master_id)
  WITH CHECK (auth.uid() = master_id);

-- Players can view games they participate in
CREATE POLICY "Players can view joined games" ON public.games
  FOR SELECT USING (
    id IN (
      SELECT game_id FROM public.game_players 
      WHERE player_id = auth.uid() AND is_active = true
    )
  );
```

### 4. Game Players Policies

**File**: `04_game_players_policies.sql`

```sql
-- Enable RLS on game_players table
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- Players can view their own game participations
CREATE POLICY "Players view own participations" ON public.game_players
  FOR SELECT USING (player_id = auth.uid());

-- Game masters can manage players in their games
CREATE POLICY "Masters manage game players" ON public.game_players
  FOR ALL USING (
    game_id IN (
      SELECT id FROM public.games WHERE master_id = auth.uid()
    )
  );

-- Players can leave games (update is_active)
CREATE POLICY "Players can leave games" ON public.game_players
  FOR UPDATE USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());
```

### 5. Message Policies

**File**: `05_messages_policies.sql`

```sql
-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Players can view messages in their games
CREATE POLICY "Players view game messages" ON public.messages
  FOR SELECT USING (
    game_id IN (
      SELECT game_id FROM public.game_players 
      WHERE player_id = auth.uid() AND is_active = true
    )
    AND (
      is_private = false
      OR sender_id = auth.uid()
      OR recipient_id = auth.uid()
    )
  );

-- Players can send messages in their games
CREATE POLICY "Players send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND game_id IN (
      SELECT game_id FROM public.game_players 
      WHERE player_id = auth.uid() AND is_active = true
    )
  );

-- Senders can edit their own messages
CREATE POLICY "Senders edit own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());
```

### 6. Character Policies

**File**: `06_characters_policies.sql`

```sql
-- Enable RLS on characters table
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Players can manage their own characters
CREATE POLICY "Players manage own characters" ON public.characters
  FOR ALL USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

-- Game masters can view characters in their games
CREATE POLICY "Masters view game characters" ON public.characters
  FOR SELECT USING (
    game_id IN (
      SELECT id FROM public.games WHERE master_id = auth.uid()
    )
  );

-- Players in the same game can view active characters
CREATE POLICY "Players view game characters" ON public.characters
  FOR SELECT USING (
    is_active = true
    AND game_id IN (
      SELECT game_id FROM public.game_players 
      WHERE player_id = auth.uid() AND is_active = true
    )
  );
```

## Security Best Practices

### 1. Policy Testing

Before deploying policies, test them thoroughly:

```sql
-- Test as different users to ensure proper isolation
SET SESSION ROLE authenticated;
SET SESSION "request.jwt.claims" = '{"sub":"user-id-here"}';

-- Run queries to verify access control
SELECT * FROM public.users;
SELECT * FROM public.messages WHERE game_id = 'some-game-id';
```

### 2. Policy Performance

- Use indexes on columns frequently used in policies
- Avoid complex subqueries in policies when possible
- Monitor query performance after policy implementation

### 3. Policy Maintenance

- Review policies when adding new features
- Update policies when data access requirements change
- Document policy changes with migration files

## Implementation Order

1. **Users and Profiles**: Basic user data access
2. **Games**: Game creation and management
3. **Game Players**: Player-game relationships
4. **Messages**: Chat functionality with private message support
5. **Characters**: Character sheet management

## Database Functions

### Helper Functions

**File**: `00_helper_functions.sql`

```sql
-- Function to check if user is game master
CREATE OR REPLACE FUNCTION is_game_master(game_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.games 
    WHERE id = game_uuid AND master_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is active player in game
CREATE OR REPLACE FUNCTION is_active_player(game_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.game_players 
    WHERE game_id = game_uuid 
    AND player_id = auth.uid() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Application to Database

Run these SQL files in order when setting up a new Supabase database:

```bash
# Using Supabase CLI
supabase db reset
supabase migration new add_rls_policies
# Copy the SQL content to the migration file
supabase db push
```

## Monitoring and Debugging

### Enable Policy Logging

```sql
-- Enable RLS policy logging for debugging
SET log_statement = 'all';
SET log_min_duration_statement = 0;
```

### Common Policy Issues

1. **Users can't see their own data**: Check that `auth.uid()` is properly set
2. **Performance issues**: Add indexes on policy filter columns
3. **Complex joins failing**: Simplify policies or use security definer functions

## Future Enhancements

- **Audit Logs**: Add policies for tracking data changes
- **Advanced Permissions**: Role-based access with custom roles
- **Tenant Isolation**: Multi-tenant support if needed
- **API Rate Limiting**: Database-level rate limiting policies