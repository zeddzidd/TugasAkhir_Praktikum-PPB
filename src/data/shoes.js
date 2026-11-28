// Seluruh sepatu dummy SVG telah dihapus sesuai permintaan agar hanya menampilkan sepatu asli hasil unggahan
export const DEFAULT_SHOES = []

export function isDummyShoe(shoe) {
  if (!shoe) return false
  const id = String(shoe.id || '')
  if (
    id === 'shoe-shox' ||
    id === 'shoe-0' ||
    id === 'shoe-1' ||
    id === 'shoe-2' ||
    id === 'shoe-3' ||
    id === 'shoe-4' ||
    id === 'shoe-5' ||
    id === 'shoe-6'
  ) {
    return true
  }
  const img = String(shoe.image || '')
  if (img.startsWith('/shoes/') && img.endsWith('.svg')) {
    return true
  }
  return false
}

export const CATEGORIES = ['Semua', 'Sneakers', 'Basketball', 'Running', 'Casual', 'Apparel', 'Luxury']

export const SUB_NAV_ITEMS = [
  { id: 'redemption', label: 'Redemption Center' },
  { id: 'express', label: 'Express Shipping', icon: '⚡' },
  { id: 'standard', label: 'Standard Shipping', icon: '📦' },
  { id: 'Sneakers', label: 'Sneakers' },
  { id: 'Apparel', label: 'Apparel' },
  { id: 'Luxury', label: 'Luxury' },
  { id: 'Electronics', label: 'Electronics & Collectibles' },
  { id: 'Watches', label: 'Watches' },
  { id: 'K-Brands', label: 'K-Brands' },
  { id: 'Trading Cards', label: 'Trading Cards' },
]

export const BRANDS = ['Semua', 'Jordan', 'Nike', 'Adidas', 'New Balance']

export function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number)
}
