import { createClient } from '@/lib/supabase/client'

interface UpdateProfileData {
  username: string
  bio: string
  timezone: string
}

interface UpdatePreferencesData {
  theme: 'system' | 'light' | 'dark'
  fontSize: 'small' | 'medium' | 'large'
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private'
    showOnlineStatus: boolean
    allowFriendRequests: boolean
    showGameHistory: boolean
    allowDirectMessages: boolean
  }
  notifications: {
    email: {
      gameInvites: boolean
      friendRequests: boolean
      messages: boolean
      gameUpdates: boolean
      weeklyDigest: boolean
    }
    push: {
      enabled: boolean
      gameActivity: boolean
      mentions: boolean
      friendsOnline: boolean
    }
  }
  display: {
    compactMode: boolean
    showAvatars: boolean
    animationsEnabled: boolean
    colorblindMode?: 'protanopia' | 'deuteranopia' | 'tritanopia'
    highContrast: boolean
  }
}

export async function updateUserProfile(profileData: UpdateProfileData): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Update users table
  const { error: userError } = await supabase
    .from('users')
    .update({
      username: profileData.username,
    })
    .eq('id', user.id)

  if (userError) throw userError

  // Update or create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      bio: profileData.bio,
      timezone: profileData.timezone,
    })

  if (profileError) throw profileError
}

export async function updateUserPreferences(preferences: Partial<UpdatePreferencesData>): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Update theme and fontSize in users table
  const userUpdates: any = {}
  if (preferences.theme) userUpdates.theme = preferences.theme
  if (preferences.fontSize) userUpdates.font_size = preferences.fontSize

  if (Object.keys(userUpdates).length > 0) {
    const { error: userError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', user.id)

    if (userError) throw userError
  }

  // Update profile preferences
  const profileUpdates: any = {}
  if (preferences.privacy) profileUpdates.privacy = preferences.privacy
  if (preferences.notifications) profileUpdates.notifications = preferences.notifications
  if (preferences.display) profileUpdates.display = preferences.display

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        ...profileUpdates,
      })

    if (profileError) throw profileError
  }
}

export async function uploadAvatar(file: File): Promise<string> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Upload file to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  const avatarUrl = urlData.publicUrl

  // Update user avatar URL
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (updateError) throw updateError

  return avatarUrl
}

export async function deleteAccount(): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // This would need to be implemented as an Edge Function
  // for proper user deletion with all related data
  throw new Error('Account deletion not implemented yet')
}

export async function exportUserData(): Promise<any> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Get all user data
  const [
    { data: userData },
    { data: profileData },
    { data: gamesData },
    { data: charactersData },
    { data: messagesData },
    { data: friendsData },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('games').select('*').eq('master_id', user.id),
    supabase.from('characters').select('*').eq('player_id', user.id),
    supabase.from('messages').select('*').eq('sender_id', user.id),
    supabase.from('friend_relationships').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
  ])

  return {
    user: userData,
    profile: profileData,
    games: gamesData,
    characters: charactersData,
    messages: messagesData,
    friends: friendsData,
    exportedAt: new Date().toISOString(),
  }
}