# Applying RLS Policies to Supabase

## Quick Start

Run this command in your terminal:

```bash
npm run apply-rls
```

If the script doesn't work, follow the manual steps below.

## Manual Application via Supabase Dashboard

### Step 1: Access SQL Editor
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Apply Policies
1. Open the file `supabase/policies/rls-policies.sql` in your code editor
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** or press `Cmd/Ctrl + Enter`

### Step 3: Verify Application
Check if policies were applied successfully:
```sql
-- Check if RLS is enabled on tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'games', 'game_players', 'messages');
```

All tables should show `rowsecurity = true`.

## Troubleshooting

### Error: "policy already exists"
This is normal! It means the policy is already applied. You can safely ignore this error.

### Error: "must be owner of table"
You need to use the service role key, not the anon key. Check your `.env.local` file:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Error: "permission denied"
1. Ensure you're using the correct database credentials
2. Try applying via the Supabase Dashboard instead
3. Contact Supabase support if the issue persists

## Development Mode

During development, you can temporarily bypass RLS checks:

1. Open your browser's Developer Console
2. Run: `localStorage.setItem('rls_bypass_enabled', 'true')`
3. Refresh the page
4. You'll see a warning banner indicating bypass mode is active

**⚠️ WARNING**: This only works in development mode and should NEVER be used in production.

## Testing RLS Policies

After applying policies, test them:

```bash
# Run the test suite
npm run test:rls

# Or manually test in the app
# 1. Create a new game
# 2. Try to access it with a different user
# 3. Verify access is denied
```

## Common Issues & Solutions

### Issue 1: Can't create games
**Solution**: Ensure the user is authenticated and the `games` insert policy is applied.

### Issue 2: Can't see other players
**Solution**: Check the `game_players` select policy is correctly configured.

### Issue 3: Messages not visible
**Solution**: Verify the `messages` table has proper RLS policies for game participants.

## Need Help?

1. Check the [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
2. Review our policies in `supabase/policies/rls-policies.sql`
3. Ask in the project's issues or discussions

## Security Best Practices

1. **Never disable RLS in production** - It's your primary security layer
2. **Test policies thoroughly** - Use different user accounts to verify access
3. **Keep policies simple** - Complex policies can impact performance
4. **Monitor performance** - RLS adds overhead, optimize queries accordingly

## Policy Overview

Our RLS policies implement:
- **User isolation**: Users can only see/modify their own data
- **Game access**: Only game participants can access game data
- **Master privileges**: Game masters have additional permissions
- **Friend visibility**: Friends can see each other's presence
- **Message security**: Messages are only visible to game participants

Each table has specific policies for SELECT, INSERT, UPDATE, and DELETE operations.