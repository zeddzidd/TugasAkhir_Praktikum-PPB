export const ORDERS_STORAGE_KEY = 'zedconsign_user_orders_v1'

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

export function saveOrder(order) {
  try {
    const list = getAllOrders()
    list.unshift(order)
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('zedconsign_orders_updated'))
    }
    return list
  } catch (e) {
    console.error('Error saving order:', e)
    return []
  }
}

export function updateOrder(orderId, updates) {
  try {
    const list = getAllOrders()
    const index = list.findIndex((o) => o.id === orderId)
    if (index >= 0) {
      list[index] = { ...list[index], ...updates }
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('zedconsign_orders_updated'))
      }
      return list[index]
    }
  } catch (e) {
    console.error('Error updating order:', e)
  }
  return null
}
