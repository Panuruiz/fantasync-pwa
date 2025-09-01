-- Diagnostic query to check actual column names in game_players table
-- Run this first to see what columns exist

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_players' 
AND table_schema = 'public';

-- If the above shows different column names, update the policies accordingly