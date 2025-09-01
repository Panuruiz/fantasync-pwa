-- Drop existing RLS policies for characters table before migration
-- This is needed to allow Prisma to modify the table structure

DROP POLICY IF EXISTS "characters_insert_player" ON characters;
DROP POLICY IF EXISTS "characters_update_owner" ON characters;
DROP POLICY IF EXISTS "characters_delete_owner" ON characters;
DROP POLICY IF EXISTS "characters_select_player" ON characters;
DROP POLICY IF EXISTS "characters_select_public" ON characters;
DROP POLICY IF EXISTS "characters_select_master" ON characters;
DROP POLICY IF EXISTS "characters_update_master" ON characters;

-- Note: We will recreate these policies after the migration with the new schema