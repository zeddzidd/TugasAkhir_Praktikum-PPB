import { createClient } from '@supabase/supabase-js'

const activeUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : null
const activeKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : null

// Pastikan selalu menggunakan URL & Key project aktif pkyghvhifthnxlrzfpoc
const supabaseUrl =
  activeUrl && !activeUrl.includes('wywiqcisdeesfopvvfse')
    ? activeUrl
    : 'https://pkyghvhifthnxlrzfpoc.supabase.co'

const supabaseAnonKey =
  activeKey && !activeKey.includes('6bywVOvNvY6duH2KloZgnA')
    ? activeKey
    : 'sb_publishable_Ve1pH-WiP9eR0RW8wKG-lA_oaa9LcG7'

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
// Authentication API (Direct Database Table 'users' & 'profiles' Storage)
// -----------------------------------------------------------------------------

/**
 * Register a new user
 * Directly writes to Supabase 'users' and 'profiles' table without email rate limits
 * Strictly blocks duplicate emails
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

  // 1. Cek apakah email sudah terdaftar di tabel Supabase 'users'
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: existingDbUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (existingDbUser) {
        throw new Error(
          `Akun dengan email '${normalizedEmail}' sudah terdaftar di database Supabase! Anda tidak dapat mendaftar lagi dengan email yang sama. Silakan gunakan menu Masuk (Login).`
        )
      }
    } catch (err) {
      if (err.message && err.message.includes('sudah terdaftar di database')) {
        throw err
      }
    }
  }

  // 2. Cek apakah email sudah terdaftar di cache / database lokal
  const localUsers = getLocalUsers()
  const existingLocal = localUsers.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  )
  if (existingLocal) {
    throw new Error(
      `Akun dengan email '${normalizedEmail}' sudah terdaftar di database! Anda tidak dapat mendaftar lagi dengan email yang sama. Silakan gunakan menu Masuk (Login).`
    )
  }

  const userId = 'usr_' + Date.now()

  // 3. Masukkan data LANGSUNG ke tabel Supabase 'users' dan 'profiles'
  if (isSupabaseConfigured && supabase) {
    try {
      const { error: userErr } = await supabase.from('users').upsert({
        id: userId,
        full_name: cleanName,
        email: normalizedEmail,
        phone: cleanPhone,
        password: password,
        role: 'consignor',
        created_at: new Date().toISOString(),
      })
      if (userErr) {
        console.error('Supabase users upsert error:', userErr.message)
      }
    } catch (err) {
      console.warn('Direct insert to Supabase users table warning:', err)
    }

    try {
      const { error: profErr } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: cleanName,
        email: normalizedEmail,
        phone: cleanPhone,
        role: 'consignor',
        updated_at: new Date().toISOString(),
      })
      if (profErr) {
        console.error('Supabase profiles upsert error:', profErr.message)
      }
    } catch (err) {
      console.warn('Direct insert to Supabase profiles table warning:', err)
    }

    // Coba juga Auth Supabase jika memungkinkan (abaikan jika error email limit)
    try {
      await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
          },
        },
      })
    } catch {
      // Data sudah aman tersimpan langsung di tabel users & profiles
    }
  }

  // 4. Simpan ke database lokal untuk persistensi offline
  const newAccount = {
    id: userId,
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
 * Checks directly against Supabase 'users' table and local storage
 */
export async function signInUser({ email, password }) {
  if (!email || !email.trim()) {
    throw new Error('Alamat email wajib diisi.')
  }
  if (!password) {
    throw new Error('Kata sandi wajib diisi.')
  }

  const normalizedEmail = email.trim().toLowerCase()

  // 1. Cek langsung ke tabel Supabase 'users'
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (dbUser) {
        if (dbUser.password && dbUser.password !== password) {
          throw new Error('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.')
        }

        const session = {
          user: {
            id: dbUser.id,
            email: dbUser.email,
            fullName: dbUser.full_name || normalizedEmail.split('@')[0],
            phone: dbUser.phone || '',
            role: dbUser.role || 'consignor',
            provider: 'supabase',
          },
        }

        // Pastikan tabel profiles selalu sinkron
        try {
          await supabase.from('profiles').upsert({
            id: dbUser.id,
            full_name: session.user.fullName,
            email: dbUser.email,
            phone: session.user.phone,
            updated_at: new Date().toISOString(),
          })
        } catch {}

        setLocalSession(session)
        saveLocalUser({
          id: dbUser.id,
          email: normalizedEmail,
          password,
          fullName: session.user.fullName,
          phone: session.user.phone,
        })
        return session
      }
    } catch (err) {
      if (err.message && err.message.includes('Kata sandi yang Anda masukkan salah')) {
        throw err
      }
    }

    // 2. Cek via Supabase Auth jika sebelumnya terdaftar di Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (!error && data?.user) {
        const session = {
          user: {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name || normalizedEmail.split('@')[0],
            phone: data.user.user_metadata?.phone || '',
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
    } catch {}
  }

  // 3. Fallback: Cek ke database pengguna lokal (termasuk demo user bawaan praktikum Shiddiq Yazid)
  const localUsers = getLocalUsers()
  const foundLocal = localUsers.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  )

  if (foundLocal) {
    if (foundLocal.password && foundLocal.password !== password) {
      throw new Error('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.')
    }

    const session = {
      user: {
        id: foundLocal.id,
        email: foundLocal.email,
        fullName: foundLocal.fullName,
        phone: foundLocal.phone,
        createdAt: foundLocal.createdAt,
        provider: foundLocal.provider || 'local-storage',
      },
    }

    setLocalSession(session)
    return session
  }

  throw new Error(
    `Akun dengan email '${normalizedEmail}' belum terdaftar. Silakan gunakan menu Daftar (Register) terlebih dahulu.`
  )
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
    try {
      await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone,
        })
        .eq('id', userId)
    } catch (e) {
      console.warn('Update users table warning:', e)
    }

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        phone,
        updated_at: new Date().toISOString(),
      })
      if (error) {
        console.warn('Update profiles table warning:', error.message)
      }
    } catch (e) {
      console.warn('Update profiles table exception:', e)
    }
  }

  const session = getLocalSession()
  if (session && session.user) {
    session.user.fullName = fullName
    session.user.phone = phone
    setLocalSession(session)
  }
  return session
}

// -----------------------------------------------------------------------------
// Shoes Catalog Supabase Sync API
// -----------------------------------------------------------------------------

/**
 * Fetch shoes from Supabase database
 */
export async function fetchShoesFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('shoes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('Shoes table not yet initialized in Supabase:', error.message)
      return null
    }
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => ({
        id: item.id,
        name: item.name,
        colorway: item.colorway || '',
        brand: item.brand,
        category: item.category,
        size: item.size,
        condition: item.condition,
        price: Number(item.price),
        image: item.image || (Array.isArray(item.images) && item.images[0]) || '/shoes/dunk-low.svg',
        images: Array.isArray(item.images) && item.images.length > 0
          ? item.images
          : [item.image || '/shoes/dunk-low.svg'],
        consignor: item.consignor || 'ZedConsign Verified Seller',
        stock: Number(item.stock) || 1,
        isFeatured: Boolean(item.is_featured),
        isExpress: Boolean(item.is_express),
        description: item.description || '',
      }))
    }
    return null
  } catch (e) {
    console.warn('Error fetching shoes from Supabase:', e)
    return null
  }
}

/**
 * Upsert or insert shoe to Supabase database
 */
export async function syncShoeToSupabase(shoe) {
  if (!isSupabaseConfigured || !supabase) return
  try {
    const primaryImg = (Array.isArray(shoe.images) && shoe.images[0]) || shoe.image || '/shoes/dunk-low.svg'
    const finalImgs = Array.isArray(shoe.images) && shoe.images.length > 0 ? shoe.images : [primaryImg]

    await supabase.from('shoes').upsert({
      id: shoe.id,
      name: shoe.name,
      colorway: shoe.colorway || '',
      brand: shoe.brand,
      category: shoe.category,
      size: shoe.size,
      condition: shoe.condition,
      price: Number(shoe.price),
      image: primaryImg,
      images: finalImgs,
      description: shoe.description || '',
      consignor: shoe.consignor || 'ZedConsign Verified Seller',
      stock: Number(shoe.stock) || 1,
      is_featured: Boolean(shoe.isFeatured),
      is_express: Boolean(shoe.isExpress),
    })
  } catch (err) {
    console.warn('Failed to sync shoe to Supabase:', err)
  }
}

/**
 * Delete shoe from Supabase database
 */
export async function deleteShoeFromSupabase(shoeId) {
  if (!isSupabaseConfigured || !supabase) return
  try {
    await supabase.from('shoes').delete().eq('id', shoeId)
  } catch (err) {
    console.warn('Failed to delete shoe from Supabase:', err)
  }
}

/**
 * Bulk sync all shoes into Supabase database
 */
export async function syncAllShoesToSupabase(shoesList) {
  if (!isSupabaseConfigured || !supabase || !Array.isArray(shoesList)) {
    return { success: false, message: 'Supabase client belum terhubung' }
  }
  try {
    const formatted = shoesList.map((shoe) => {
      const primaryImg =
        (Array.isArray(shoe.images) && shoe.images[0]) || shoe.image || '/shoes/dunk-low.svg'
      const finalImgs =
        Array.isArray(shoe.images) && shoe.images.length > 0 ? shoe.images : [primaryImg]

      return {
        id: String(shoe.id),
        name: shoe.name,
        colorway: shoe.colorway || '',
        brand: shoe.brand,
        category: shoe.category,
        size: shoe.size,
        condition: shoe.condition,
        price: Number(shoe.price),
        image: primaryImg,
        images: finalImgs,
        description: shoe.description || '',
        consignor: shoe.consignor || 'ZedConsign Verified Seller',
        stock: Number(shoe.stock) || 1,
        is_featured: Boolean(shoe.isFeatured),
        is_express: Boolean(shoe.isExpress),
      }
    })

    const { error } = await supabase.from('shoes').upsert(formatted)
    if (error) {
      console.warn('Sync all shoes warning:', error.message)
      return { success: false, message: error.message }
    }
    return { success: true, count: formatted.length }
  } catch (err) {
    console.warn('Sync all shoes error:', err)
    return { success: false, message: err.message }
  }
}
