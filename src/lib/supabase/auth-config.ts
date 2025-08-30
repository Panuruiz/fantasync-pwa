export const authConfig = {
  persistSession: true,
  storageKey: 'fantasync-auth',
  flowType: 'pkce' as const,
  detectSessionInUrl: true,
  autoRefreshToken: true,
  providers: ['google', 'discord', 'github'] as const,
  redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
}