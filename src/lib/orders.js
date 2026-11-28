import { supabase, isSupabaseConfigured, isAdminUser } from './supabase.js'

export const ORDERS_STORAGE_KEY = 'zedconsign_user_orders_v1'

// Helper safe setter for localStorage with quota protection for mobile photos
export function saveLocalOrders(list) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('zedconsign_orders_updated'))
    }
    return true
  } catch (e) {
    console.warn('LocalStorage kuota penuh, mencoba menyimpan versi teroptimasi:', e)
    try {
      // Jika kuota penuh (sering terjadi di HP karena resolusi kamera tinggi),
      // kompres bukti transfer pada pesanan lama agar pesanan baru tetap tersimpan
      const optimized = list.map((order, idx) => {
        if (idx === 0) return order // Pesanan terbaru tetap utuh
        return {
          ...order,
          paymentProof: order.paymentProof && order.paymentProof.length > 50000 ? null : order.paymentProof,
        }
      })
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(optimized))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('zedconsign_orders_updated'))
      }
      return true
    } catch (err2) {
      console.error('Gagal menyimpan pesanan ke localStorage:', err2)
      return false
    }
  }
}

export function getAllOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Filter out mock legacy orders
    return parsed.filter(
      (o) =>
        o.id !== 'ORD-ZC-2026-9812' &&
        o.id !== 'ORD-ZC-2026-7451' &&
        o.id !== 'ORD-ZC-2026-6120'
    )
  } catch {
    return []
  }
}

// Sync user orders to Supabase cloud profile storage (cross-device sync between Laptop & HP)
export async function syncOrdersToSupabase(orderList, currentUser) {
  if (!isSupabaseConfigured || !supabase || !currentUser) return
  try {
    const targetUserId = currentUser.id || currentUser.userId
    if (!targetUserId) return

    // Saring pesanan milik user ini
    const myOrders = orderList.filter((o) => {
      if (o.userId && o.userId === targetUserId) return true
      if (o.userEmail && currentUser.email && o.userEmail.toLowerCase() === currentUser.email.toLowerCase()) return true
      return false
    })

    // Bersihkan ukuran data agar sinkronisasi cloud instan
    const lightweightOrders = myOrders.slice(0, 30).map((o) => ({
      ...o,
      // Jika bukti pembayaran sangat besar, simpan ringkas
      paymentProof: o.paymentProof && o.paymentProof.length > 150000 ? o.paymentProof.slice(0, 150000) : o.paymentProof,
    }))

    const payload = 'ORDERS::' + JSON.stringify(lightweightOrders)

    await supabase
      .from('profiles')
      .update({ avatar_url: payload })
      .eq('id', targetUserId)
  } catch (err) {
    console.warn('Gagal sinkronisasi pesanan ke Supabase:', err)
  }
}

// Fetch and merge orders from Supabase cloud (pulls orders made on Laptop to HP and vice versa)
export async function fetchOrdersFromSupabase(currentUser) {
  if (!isSupabaseConfigured || !supabase) return getAllOrders()
  try {
    const localList = getAllOrders()
    const mergedMap = new Map()

    // 1. Masukkan semua pesanan lokal ke map
    localList.forEach((o) => {
      if (o && o.id) mergedMap.set(o.id, o)
    })

    // 2. Jika Admin: ambil semua pesanan dari semua profil pengguna
    // Jika User biasa: ambil pesanan milik user tersebut
    let query = supabase.from('profiles').select('id, full_name, email, avatar_url')

    if (!isAdminUser(currentUser) && currentUser?.id) {
      query = query.eq('id', currentUser.id)
    }

    const { data, error } = await query
    if (!error && Array.isArray(data)) {
      data.forEach((row) => {
        if (row.avatar_url && row.avatar_url.startsWith('ORDERS::')) {
          try {
            const rawJson = row.avatar_url.replace('ORDERS::', '')
            const cloudOrders = JSON.parse(rawJson)
            if (Array.isArray(cloudOrders)) {
              cloudOrders.forEach((co) => {
                if (co && co.id) {
                  // Jika belum ada di lokal atau data cloud lebih baru, gabungkan
                  if (!mergedMap.has(co.id)) {
                    mergedMap.set(co.id, co)
                  }
                }
              })
            }
          } catch (e) {
            console.warn('Gagal mem-parsing cloud orders:', e)
          }
        }
      })
    }

    const finalList = Array.from(mergedMap.values()).sort((a, b) => {
      return (b.id || '').localeCompare(a.id || '')
    })

    saveLocalOrders(finalList)
    return finalList
  } catch (err) {
    console.warn('Gagal mengambil pesanan dari cloud:', err)
    return getAllOrders()
  }
}

export function saveOrder(order, currentUser) {
  try {
    const list = getAllOrders()
    // Hindari duplikasi ID
    const existingIdx = list.findIndex((o) => o.id === order.id)
    if (existingIdx >= 0) {
      list[existingIdx] = order
    } else {
      list.unshift(order)
    }

    saveLocalOrders(list)

    // Sinkronkan ke Supabase agar pesanan muncul di HP dan Laptop
    const userForSync = currentUser || (order.userId ? { id: order.userId, email: order.userEmail } : null)
    if (userForSync) {
      syncOrdersToSupabase(list, userForSync)
    }

    return list
  } catch (e) {
    console.error('Error saving order:', e)
    return []
  }
}

export function updateOrder(orderId, updates, currentUser) {
  try {
    const list = getAllOrders()
    const index = list.findIndex((o) => o.id === orderId)
    if (index >= 0) {
      list[index] = { ...list[index], ...updates }
      saveLocalOrders(list)

      const targetOrder = list[index]
      const userForSync = currentUser || (targetOrder.userId ? { id: targetOrder.userId, email: targetOrder.userEmail } : null)
      if (userForSync) {
        syncOrdersToSupabase(list, userForSync)
      }

      return list[index]
    }
  } catch (e) {
    console.error('Error updating order:', e)
  }
  return null
}
