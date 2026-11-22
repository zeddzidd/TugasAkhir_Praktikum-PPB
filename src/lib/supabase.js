import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://wywiqcisdeesfopvvfse.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_6bywVOvNvY6duH2KloZgnA_dJyqrpWl'

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
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

// Default Demo User for PPB Practical assignment
const DEFAULT_DEMO_USER = {
  id: 'usr_shiddiq_yazid_41',
  email: 'shiddiqyazidn29@gmail.com',
  password: 'password123',
  fullName: 'Shiddiq Yazid Nurhakim',
  phone: '081234567890',
  createdAt: '2026-09-01T00:00:00.000Z',
  provider: 'system',
}

// Helper to get all registered users from database
export function getLocalUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY)
    const list = raw ? JSON.parse(raw) : []
    // Ensure default demo user exists
    if (!list.some((u) => u.email.toLowerCase() === DEFAULT_DEMO_USER.email.toLowerCase())) {
      list.push(DEFAULT_DEMO_USER)
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(list))
    }
    return list
  } catch {
    return [DEFAULT_DEMO_USER]
  }
}

// Helper to save or update user in database
export function saveLocalUser(user) {
  try {
    const list = getLocalUsers()
    const index = list.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase())
    if (index >= 0) {
      list[index] = { ...list[index], ...user }
    } else {
      list.push(user)
    }
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Error saving local user:', e)
  }
}

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
 * Strictly blocks registration if the email is already in the database
 */
export async function signUpUser({ email, password, fullName, phone = '' }) {
  if (!email || !email.trim()) {
    throw new Error('Alamat email wajib diisi.')
  }
  if (!password || password.length < 6) {
    throw new Error('Kata sandi minimal 6 karakter.')
  }
  if (!fullName || !fullName.trim()) {
    throw new Error('Nama lengkap wajib diisi.')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const cleanName = fullName.trim()
  const cleanPhone = phone.trim()

  // 1. Cek apakah email sudah terdaftar di database lokal / cache
  const localUsers = getLocalUsers()
  const existingLocal = localUsers.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  )
  if (existingLocal) {
    throw new Error(
      `Akun dengan email '${normalizedEmail}' sudah terdaftar di database! Anda tidak dapat mendaftar lagi dengan email yang sama. Silakan gunakan menu Masuk (Login).`
    )
  }

  // 2. Jika Supabase terhubung, daftarkan ke Supabase Auth
  let supabaseUserId = null
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
          },
        },
      })

      // Jika Supabase mengembalikan error user sudah ada
      if (error) {
        const errMsg = error.message ? error.message.toLowerCase() : ''
        if (
          errMsg.includes('already registered') ||
          errMsg.includes('already exists') ||
          errMsg.includes('user already')
        ) {
          saveLocalUser({
            id: 'usr_' + Date.now(),
            email: normalizedEmail,
            password,
            fullName: cleanName,
            phone: cleanPhone,
            createdAt: new Date().toISOString(),
          })
          throw new Error(
            `Akun dengan email '${normalizedEmail}' sudah terdaftar di database Supabase! Anda tidak dapat mendaftar lagi dengan email yang sama. Silakan masuk (login).`
          )
        }
        // Jika limit email SMTP Supabase tercapai, jangan crash; lanjutkan simpan ke database aplikasi
        if (error.status === 429 || errMsg.includes('rate limit')) {
          console.warn('Supabase email rate limit reached, continuing with persistent local database.')
        } else {
          throw error
        }
      }

      // Deteksi Supabase: jika email sudah pernah terdaftar, Supabase mengembalikan data.user dengan identities: []
      if (
        data?.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        saveLocalUser({
          id: data.user.id || 'usr_' + Date.now(),
          email: normalizedEmail,
          password,
          fullName: cleanName,
          phone: cleanPhone,
          createdAt: new Date().toISOString(),
        })
        throw new Error(
          `Akun dengan email '${normalizedEmail}' sudah terdaftar di database Supabase! Anda tidak dapat mendaftar lagi dengan email yang sama. Silakan gunakan menu Masuk (Login).`
        )
      }

      if (data?.user?.id) {
        supabaseUserId = data.user.id
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: cleanName,
            email: normalizedEmail,
            phone: cleanPhone,
            updated_at: new Date().toISOString(),
          })
        } catch {
          // fallback jika tabel profiles belum dibuat
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('sudah terdaftar di database')) {
        throw err
      }
      console.warn('Supabase signUp warning:', err)
    }
  }

  // 3. Simpan akun baru ke database aplikasi
  const newAccount = {
    id: supabaseUserId || 'usr_' + Date.now(),
    email: normalizedEmail,
    password,
    fullName: cleanName,
    phone: cleanPhone,
    createdAt: new Date().toISOString(),
    provider: isSupabaseConfigured ? 'supabase' : 'local-storage',
  }

  saveLocalUser(newAccount)

  const session = {
    user: {
      id: newAccount.id,
      email: newAccount.email,
      fullName: newAccount.fullName,
      phone: newAccount.phone,
      createdAt: newAccount.createdAt,
      provider: newAccount.provider,
    },
  }

  setLocalSession(session)
  return session
}

/**
 * Log in an existing user
 * Validates credentials strictly against database
 */
export async function signInUser({ email, password }) {
  if (!email || !email.trim()) {
    throw new Error('Alamat email wajib diisi.')
  }
  if (!password) {
    throw new Error('Kata sandi wajib diisi.')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const localUsers = getLocalUsers()
  const foundLocal = localUsers.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  )

  // 1. Coba login via Supabase jika terkonfigurasi
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (!error && data?.session && data?.user) {
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
              foundLocal?.fullName ||
              data.user.email.split('@')[0],
            phone:
              profileData?.phone ||
              data.user.user_metadata?.phone ||
              foundLocal?.phone ||
              '',
            createdAt: data.user.created_at,
            provider: 'supabase',
          },
        }
        setLocalSession(session)
        saveLocalUser({
          id: data.user.id,
          email: normalizedEmail,
          password,
          fullName: session.user.fullName,
          phone: session.user.phone,
        })
        return session
      }

      // Jika errornya 'Email not confirmed' (password sudah cocok di Supabase)
      if (error && (error.code === 'email_not_confirmed' || error.message?.includes('Email not confirmed'))) {
        const session = {
          user: {
            id: 'sb_' + normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_'),
            email: normalizedEmail,
            fullName: foundLocal?.fullName || normalizedEmail.split('@')[0],
            phone: foundLocal?.phone || '',
            createdAt: new Date().toISOString(),
            provider: 'supabase',
          },
        }
        setLocalSession(session)
        saveLocalUser({
          id: session.user.id,
          email: normalizedEmail,
          password,
          fullName: session.user.fullName,
          phone: session.user.phone,
        })
        return session
      }

      // Jika kata sandi salah di Supabase
      if (error && error.message?.includes('Invalid login credentials')) {
        if (foundLocal) {
          if (foundLocal.password === password) {
            const session = {
              user: {
                id: foundLocal.id,
                email: foundLocal.email,
                fullName: foundLocal.fullName,
                phone: foundLocal.phone || '',
                createdAt: foundLocal.createdAt,
                provider: foundLocal.provider || 'local-storage',
              },
            }
            setLocalSession(session)
            return session
          }
          throw new Error('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.')
        }
        throw new Error('Kata sandi yang Anda masukkan salah atau akun belum terdaftar.')
      }
    } catch (err) {
      if (err.message && (err.message.includes('Kata sandi') || err.message.includes('belum terdaftar'))) {
        throw err
      }
      console.warn('Supabase signIn fallback to local:', err)
    }
  }

  // 2. Verifikasi terhadap database aplikasi
  if (!foundLocal) {
    throw new Error(
      `Akun dengan email '${normalizedEmail}' belum terdaftar di database. Silakan klik tab 'Daftar (Register)' untuk membuat akun baru.`
    )
  }

  if (foundLocal.password !== password) {
    throw new Error('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.')
  }

  const session = {
    user: {
      id: foundLocal.id,
      email: foundLocal.email,
      fullName: foundLocal.fullName,
      phone: foundLocal.phone || '',
      createdAt: foundLocal.createdAt,
      provider: foundLocal.provider || 'local-storage',
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
