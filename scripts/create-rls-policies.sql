-- RLS Policies for D&D 5e Game Functionality
-- Characters, Combat, Notes, and Change Logs

-- Enable RLS on new tables
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE combats ENABLE ROW LEVEL SECURITY;
ALTER TABLE combat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CHARACTERS POLICIES
-- ============================================================================

-- Users can view their own characters
CREATE POLICY "characters_select_own" ON characters
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public characters in games they're part of
CREATE POLICY "characters_select_public_in_game" ON characters
  FOR SELECT
  USING (
    is_public = true 
    AND game_id IN (
      SELECT game_id FROM game_players 
      WHERE user_id = auth.uid()
    )
  );

-- Masters can view all characters in their games
CREATE POLICY "characters_select_master" ON characters
  FOR SELECT
  USING (
    game_id IN (
      SELECT id FROM games 
      WHERE master_id = auth.uid()
    )
  );

-- Users can create characters in games they're part of
CREATE POLICY "characters_insert_player" ON characters
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND game_id IN (
      SELECT game_id FROM game_players 
      WHERE user_id = auth.uid()
    )
  );

-- Users can update their own characters
CREATE POLICY "characters_update_own" ON characters
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Masters can update all characters in their games
CREATE POLICY "characters_update_master" ON characters
  FOR UPDATE
  USING (
    game_id IN (
      SELECT id FROM games 
      WHERE master_id = auth.uid()
    )
  );

-- Users can delete their own characters
CREATE POLICY "characters_delete_own" ON characters
  FOR DELETE
  USING (auth.uid() = user_id);

-- Masters can delete characters in their games
CREATE POLICY "characters_delete_master" ON characters
  FOR DELETE
  USING (
    game_id IN (
      SELECT id FROM games 
      WHERE master_id = auth.uid()
    )
  );

-- ============================================================================
-- COMBAT POLICIES
-- ============================================================================

-- Game members can view combat
CREATE POLICY "combats_select_members" ON combats
  FOR SELECT
  USING (
    game_id IN (
      SELECT game_id FROM game_players 
      WHERE user_id = auth.uid()
      UNION
      SELECT id FROM games 
      WHERE master_id = auth.uid()
    )
  );

-- Only masters can manage combat
CREATE POLICY "combats_insert_master" ON combats
  FOR INSERT
  WITH CHECK (
    game_id IN (
      SELECT id FROM games 
      WHERE master_id = auth.uid()
    )
  );

CREATE POLICY "combats_update_master" ON combats
  FOR UPDATE
  USING (
    game_id IN (
      SELECT id FROM games 
      WHERE master_id = auth.uid()
    )
  );

CREATE POLICY "combats_delete_master" ON combats
  FOR DELETE
  USING (
    game_id IN (
      SELECT id FROM games 
      WHERE master_id = auth.uid()
    )
  );

-- ============================================================================
-- COMBAT PARTICIPANTS POLICIES
-- ============================================================================

-- Game members can view combat participants
CREATE POLICY "combat_participants_select_members" ON combat_participants
  FOR SELECT
  USING (
    combat_id IN (
      SELECT id FROM combats
      WHERE game_id IN (
        SELECT game_id FROM game_players 
        WHERE user_id = auth.uid()
        UNION
        SELECT id FROM games 
        WHERE master_id = auth.uid()
      )
    )
  );

-- Masters can manage combat participants
CREATE POLICY "combat_participants_insert_master" ON combat_participants
  FOR INSERT
  WITH CHECK (
    combat_id IN (
      SELECT id FROM combats
      WHERE game_id IN (
        SELECT id FROM games 
        WHERE master_id = auth.uid()
      )
    )
  );

CREATE POLICY "combat_participants_update_master" ON combat_participants
  FOR UPDATE
  USING (
    combat_id IN (
      SELECT id FROM combats
      WHERE game_id IN (
        SELECT id FROM games 
        WHERE master_id = auth.uid()
      )
    )
  );

CREATE POLICY "combat_participants_delete_master" ON combat_participants
  FOR DELETE
  USING (
    combat_id IN (
      SELECT id FROM combats
      WHERE game_id IN (
        SELECT id FROM games 
        WHERE master_id = auth.uid()
      )
    )
  );

-- Players can update their own character's combat participant data (HP, conditions)
CREATE POLICY "combat_participants_update_own_character" ON combat_participants
  FOR UPDATE
  USING (
    character_id IN (
      SELECT id FROM characters
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- NOTES POLICIES
-- ============================================================================

-- Users can view their own notes
CREATE POLICY "notes_select_own" ON notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public notes (handouts) in games they're part of
CREATE POLICY "notes_select_public_in_game" ON notes
  FOR SELECT
  USING (
    is_public = true 
    AND game_id IN (
      SELECT game_id FROM game_players 
      WHERE user_id = auth.uid()
      UNION
      SELECT id FROM games 
      WHERE master_id = auth.uid()
    )
  );

-- Users can view notes shared with them
CREATE POLICY "notes_select_shared_with_user" ON notes
  FOR SELECT
  USING (auth.uid()::text = ANY(shared_with));

-- Users can create notes in games they're part of
CREATE POLICY "notes_insert_members" ON notes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND game_id IN (
      SELECT game_id FROM game_players 
      WHERE user_id = auth.uid()
      UNION
      SELECT id FROM games 
      WHERE master_id = auth.uid()
    )
  );

-- Users can update their own notes
CREATE POLICY "notes_update_own" ON notes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notes
CREATE POLICY "notes_delete_own" ON notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Masters can delete any notes in their games (for moderation)
CREATE POLICY "notes_delete_master" ON notes
  FOR DELETE
  USING (
    game_id IN (
      SELECT id FROM games 
      WHERE master_id = auth.uid()
    )
  );

-- ============================================================================
-- CHANGE LOGS POLICIES
-- ============================================================================

-- Users can view change logs for entities they have access to
CREATE POLICY "change_logs_select_accessible" ON change_logs
  FOR SELECT
  USING (
    -- Own change logs
    auth.uid() = user_id
    OR
    -- Change logs for characters they can view
    (entity_type = 'character' AND entity_id IN (
      SELECT id FROM characters WHERE 
        user_id = auth.uid() -- Own characters
        OR (is_public = true AND game_id IN ( -- Public characters in their games
          SELECT game_id FROM game_players WHERE user_id = auth.uid()
        ))
        OR game_id IN ( -- All characters in games they master
          SELECT id FROM games WHERE master_id = auth.uid()
        )
    ))
    OR
    -- Change logs for notes they can view
    (entity_type = 'note' AND entity_id IN (
      SELECT id FROM notes WHERE 
        user_id = auth.uid() -- Own notes
        OR (is_public = true AND game_id IN ( -- Public notes in their games
          SELECT game_id FROM game_players WHERE user_id = auth.uid()
          UNION
          SELECT id FROM games WHERE master_id = auth.uid()
        ))
        OR auth.uid()::text = ANY(shared_with) -- Notes shared with them
    ))
  );

-- System creates change logs (only through application code)
CREATE POLICY "change_logs_insert_system" ON change_logs
  FOR INSERT
  WITH CHECK (true); -- Will be handled by application logic

-- No direct updates or deletes on change logs (audit trail)
CREATE POLICY "change_logs_no_update" ON change_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "change_logs_no_delete" ON change_logs
  FOR DELETE
  USING (false);