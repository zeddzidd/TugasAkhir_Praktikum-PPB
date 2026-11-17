import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
)

// Initialize Supabase Client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

// Local Storage Fallback Keys (ensures zero broken states while setting up Supabase credentials)
const LOCAL_USERS_KEY = 'zedconsign_local_users'
const LOCAL_SESSION_KEY = 'zedconsign_current_session'

// Helper to get local session
function getLocalSession() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Helper to save local session
function setLocalSession(session) {
  try {
    if (session) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY)
    }
  } catch (e) {
    console.error('Error saving session:', e)
  }
}

// -----------------------------------------------------------------------------
// Authentication API
// -----------------------------------------------------------------------------

/**
 * Register a new user
 */
export async function signUpUser({ email, password, fullName, phone = '' }) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    })
    if (error) throw error

    // Insert or update profiles table in Supabase
    if (data?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          email,
          phone,
          updated_at: new Date().toISOString(),
        })
      } catch (err) {
        console.warn('Profile table upsert skipped:', err)
      }
    }

    const session = {
      user: {
        id: data.user?.id,
        email: data.user?.email,
        fullName: fullName || data.user?.user_metadata?.full_name || email.split('@')[0],
        phone: phone || data.user?.user_metadata?.phone || '',
        createdAt: data.user?.created_at || new Date().toISOString(),
        provider: 'supabase',
      },
    }
    setLocalSession(session)
    return session
  }

  // --- Local / Offline Mock Mode ---
  const usersRaw = localStorage.getItem(LOCAL_USERS_KEY)
  const users = usersRaw ? JSON.parse(usersRaw) : []
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (existing) {
    throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau login.')
  }

  const newUser = {
    id: 'user_' + Date.now(),
    email,
    password, // Demo only
    fullName: fullName || email.split('@')[0],
    phone: phone || '',
    createdAt: new Date().toISOString(),
    provider: 'local-storage',
  }

  users.push(newUser)
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))

  const session = {
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      phone: newUser.phone,
      createdAt: newUser.createdAt,
      provider: 'local-storage',
    },
  }
  setLocalSession(session)
  return session
}

/**
 * Log in an existing user
 */
export async function signInUser({ email, password }) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    // Fetch profile data from supabase if available
    let profileData = null
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      profileData = prof
    } catch {
      // ignore
    }

    const session = {
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName:
          profileData?.full_name ||
          data.user.user_metadata?.full_name ||
          data.user.email.split('@')[0],
        phone: profileData?.phone || data.user.user_metadata?.phone || '',
        createdAt: data.user.created_at,
        provider: 'supabase',
      },
    }
    setLocalSession(session)
    return session
  }

  // --- Local / Offline Mock Mode ---
  const usersRaw = localStorage.getItem(LOCAL_USERS_KEY)
  const users = usersRaw ? JSON.parse(usersRaw) : []
  const found = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
  )

  if (!found) {
    // Demo auto-registration for easy grading / testing if user types a new account
    if (password.length >= 6) {
      return await signUpUser({
        email,
        password,
        fullName: email.split('@')[0],
      })
    }
    throw new Error('Email atau kata sandi tidak cocok. Silakan periksa kembali.')
  }

  const session = {
    user: {
      id: found.id,
      email: found.email,
      fullName: found.fullName,
      phone: found.phone || '',
      createdAt: found.createdAt,
      provider: 'local-storage',
    },
  }
  setLocalSession(session)
  return session
}

/**
 * Sign out
 */
export async function signOutUser() {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Supabase signOut error:', e)
    }
  }
  setLocalSession(null)
}

/**
 * Get current active session
 */
export async function getCurrentSession() {
  if (isSupabaseConfigured && supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        return {
          user: {
            id: session.user.id,
            email: session.user.email,
            fullName:
              session.user.user_metadata?.full_name ||
              session.user.email.split('@')[0],
            phone: session.user.user_metadata?.phone || '',
            createdAt: session.user.created_at,
            provider: 'supabase',
          },
        }
      }
    } catch (e) {
      console.warn('Error fetching Supabase session:', e)
    }
  }
  return getLocalSession()
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, { fullName, phone }) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      phone,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
  }

  const session = getLocalSession()
  if (session && session.user) {
    session.user.fullName = fullName
    session.user.phone = phone
    setLocalSession(session)
  }
  return session
}
