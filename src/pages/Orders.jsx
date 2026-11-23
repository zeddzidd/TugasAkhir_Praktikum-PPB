import { useState, useEffect } from 'react'
import { formatRupiah } from '../data/shoes.js'

const ORDERS_STORAGE_KEY = 'zedconsign_user_orders_v1'

const DEFAULT_SAMPLE_ORDERS = [
  {
    id: 'ORD-ZC-2026-9812',
    date: '23 November 2026, 14:30 WIB',
    shoeId: 'shoe-shox',
    shoeName: 'Nike Shox Z Calistra',
    shoeBrand: 'Nike',
    shoeImage: '/shoes/shox-calistra.svg',
    shoeImages: [
      '/shoes/shox-calistra.svg',
      '/shoes/goadome-foam.svg',
      '/shoes/dunk-low.svg',
      '/shoes/jordan-retro.svg',
    ],
    size: 'US 7W / EU 38',
    condition: 'Brand New In Box (BNIB)',
    price: 2899000,
    shippingCost: 45000,
    shippingType: '⚡ Express Shipping (1-2 Hari Kerja dari Vault)',
    trackingNumber: 'JNE-ZC28990141ID',
    courier: 'JNE Express x ZedConsign Courier',
    status: 'Dikirim', // 'Menunggu Pembayaran' | 'Diproses di Vault' | 'Dikirim' | 'Selesai'
    buyerName: 'Shiddiq Yazid Nurhakim',
    buyerPhone: '081234567890',
    shippingAddress: 'Jl. Prof. Soedarto No. 13, Tembalang, Kota Semarang, Jawa Tengah 50275',
    paymentMethod: 'QRIS Real-Time BCA',
    vaultVerificationTag: 'ZC-AUTH-994182-VAULT',
    verifiedBy: 'Chief Authenticator ZedConsign Vault',
  },
  {
    id: 'ORD-ZC-2026-7451',
    date: '21 November 2026, 09:15 WIB',
    shoeId: 'shoe-1',
    shoeName: 'Nike Dunk Low Retro Panda',
    shoeBrand: 'Nike',
    shoeImage: '/shoes/dunk-low.svg',
    shoeImages: [
      '/shoes/dunk-low.svg',
      '/shoes/jordan-retro.svg',
      '/shoes/goadome-foam.svg',
      '/shoes/samba-og.svg',
    ],
    size: 'US 9 / EU 42.5',
    condition: 'Brand New In Box (BNIB)',
    price: 1899000,
    shippingCost: 20000,
    shippingType: '📦 Standard Shipping (3-5 Hari Kerja)',
    trackingNumber: 'SICEPAT-ZC18990210ID',
    courier: 'SiCepat Cargo Reguler',
    status: 'Selesai',
    buyerName: 'Shiddiq Yazid Nurhakim',
    buyerPhone: '081234567890',
    shippingAddress: 'Jl. Prof. Soedarto No. 13, Tembalang, Kota Semarang, Jawa Tengah 50275',
    paymentMethod: 'BCA Virtual Account',
    vaultVerificationTag: 'ZC-AUTH-189902-VAULT',
    verifiedBy: 'Senior Authenticator ZedConsign Vault',
  },
  {
    id: 'ORD-ZC-2026-6120',
    date: '23 November 2026, 16:45 WIB',
    shoeId: 'shoe-0',
    shoeName: 'Nike Air Max Goadome Low Foam',
    shoeBrand: 'Nike',
    shoeImage: '/shoes/goadome-foam.svg',
    shoeImages: [
      '/shoes/goadome-foam.svg',
      '/shoes/shox-calistra.svg',
      '/shoes/new-balance.svg',
      '/shoes/yeezy-boost.svg',
    ],
    size: 'US 9 / EU 42.5',
    condition: 'Brand New In Box (BNIB)',
    price: 3299000,
    shippingCost: 45000,
    shippingType: '⚡ Express Shipping (1-2 Hari Kerja dari Vault)',
    trackingNumber: 'JNE-ZC32990442ID',
    courier: 'JNE Express x ZedConsign Courier',
    status: 'Diproses di Vault',
    buyerName: 'oco',
    buyerPhone: '08999111',
    shippingAddress: 'Jl. Jenderal Sudirman No. 41, Senayan, Jakarta Selatan 10210',
    paymentMethod: 'QRIS Gopay / BCA',
    vaultVerificationTag: 'ZC-AUTH-329904-VAULT',
    verifiedBy: 'Authenticity Inspection Lab Team',
  },
]

function Orders({ onNavigateCatalog, currentUser, onOpenAuth }) {
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return DEFAULT_SAMPLE_ORDERS
  })

  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null)
  const [copyToast, setCopyToast] = useState(false)

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
    } catch (e) {
      console.error(e)
    }
  }, [orders])

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchStatus =
      selectedStatus === 'all' ||
      order.status.toLowerCase().includes(selectedStatus.toLowerCase())
    const matchQuery =
      order.shoeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchQuery
  })

  const handleCopyResi = (resi) => {
    navigator.clipboard.writeText(resi)
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 2000)
  }

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Selesai':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' }
      case 'Dikirim':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' }
      case 'Diproses di Vault':
        return { bg: '#fef3c7', color: '#d97706', border: '#fde68a' }
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Toast Notification */}
      {copyToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--accent)',
            color: '#000',
            fontWeight: '700',
            fontSize: '13px',
            padding: '10px 20px',
            borderRadius: '9999px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 9999,
          }}
        >
          ✓ Nomor Resi Disalin ke Clipboard!
        </div>
      )}

      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #09131f 0%, #0d2238 100%)',
          borderRadius: '16px',
          padding: '28px 24px',
          marginBottom: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            background: 'rgba(0, 223, 162, 0.1)',
            padding: '4px 12px',
            borderRadius: '9999px',
            marginBottom: '10px',
            border: '1px solid rgba(0, 223, 162, 0.2)',
          }}
        >
          TRANSACTION &amp; ORDER TRACKING
        </span>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', margin: '0 0 8px' }}>
          Daftar Pesanan &amp; Riwayat Transaksi
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, lineHeight: '1.6' }}>
          Pantau proses kurasi fisik 100% authentic di ZedConsign Vault, verifikasi resi pengiriman, serta cetak invoice transaksi resmi Anda.
        </p>
      </div>

      {/* Guest Note */}
      {!currentUser && (
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔒</span>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
              Anda sedang melihat <strong>Pratinjau Sampel Transaksi Pesanan</strong>. Masuk ke akun Anda untuk melihat pesanan pribadi.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenAuth && onOpenAuth('login')}
            style={{
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Masuk Akun
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Semua Pesanan' },
            { id: 'Vault', label: 'Vault Autentikasi' },
            { id: 'Dikirim', label: 'Sedang Dikirim' },
            { id: 'Selesai', label: 'Selesai' },
          ].map((tab) => {
            const isActive = selectedStatus === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  background: isActive ? 'var(--accent)' : 'var(--bg-card)',
                  color: isActive ? '#000000' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div style={{ minWidth: '260px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Cari nama sepatu, ID, atau resi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ margin: 0, width: '100%' }}
          />
        </div>
      </div>

      {/* Orders List Grid */}
      {filteredOrders.length > 0 ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredOrders.map((order) => {
            const statusStyle = getStatusBadgeStyle(order.status)
            return (
              <div
                key={order.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '20px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedOrderDetail(order)}
              >
                {/* Top Row: Order ID, Date, and Status Badge */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '12px',
                    marginBottom: '14px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '0.5px' }}>
                      {order.id}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>&bull; {order.date}</span>
                  </div>

                  <span
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`,
                      padding: '3px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '800',
                      letterSpacing: '0.3px',
                    }}
                  >
                    ● {order.status}
                  </span>
                </div>

                {/* Middle Row: Shoe Photo, Details, and Pricing */}
                <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <img
                    src={order.shoeImage || '/shoes/dunk-low.svg'}
                    alt={order.shoeName}
                    style={{
                      width: '84px',
                      height: '84px',
                      objectFit: 'contain',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '10px',
                      padding: '6px',
                      border: '1px solid var(--border-color)',
                    }}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = '/shoes/dunk-low.svg'
                    }}
                  />

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 4px', color: 'var(--text-main)' }}>
                      {order.shoeName}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '6px' }}>
                      Ukuran: <strong>{order.size}</strong> &bull; Kondisi: <strong>{order.condition}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      Metode: {order.shippingType}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '150px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Total Transaksi:</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent)', marginBottom: '8px' }}>
                      {formatRupiah(order.price + order.shippingCost)}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedOrderDetail(order)
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--accent)',
                        color: 'var(--accent)',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      👁️ Lihat Detail &amp; Resi
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>👟</div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px' }}>
            Belum Ada Pesanan yang Cocok
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '20px' }}>
            Tidak ada riwayat transaksi pada filter ini. Jelajahi katalog sneaker original terverifikasi kami sekarang.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={onNavigateCatalog}
            style={{ display: 'inline-block' }}
          >
            Buka Katalog Sepatu
          </button>
        </div>
      )}

      {/* DETAIL MODAL (Halaman Detail Pesanan & Resi Pengiriman) */}
      {selectedOrderDetail && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedOrderDetail(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="auth-modal-card"
            style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '14px',
                marginBottom: '18px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: 'var(--accent)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  OFFICIAL INVOICE &amp; VAULT PASSPORT
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '2px 0 0', color: 'var(--text-main)' }}>
                  Rincian Detail Pesanan
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetail(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                }}
              >
                &times;
              </button>
            </div>

            {/* Status Timeline */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px' }}>Status Saat Ini:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span
                  style={{
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    fontWeight: '800',
                    fontSize: '13px',
                    ...getStatusBadgeStyle(selectedOrderDetail.status),
                  }}
                >
                  {selectedOrderDetail.status}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  (Invoice: {selectedOrderDetail.id})
                </span>
              </div>

              {/* Progress Steps Indicator */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '4px',
                  textAlign: 'center',
                  fontSize: '10px',
                  fontWeight: '700',
                  color: 'var(--text-dim)',
                }}
              >
                <div style={{ color: 'var(--accent)' }}>
                  <div style={{ height: '4px', background: 'var(--accent)', borderRadius: '2px', marginBottom: '4px' }} />
                  1. Dipesan
                </div>
                <div style={{ color: 'var(--accent)' }}>
                  <div style={{ height: '4px', background: 'var(--accent)', borderRadius: '2px', marginBottom: '4px' }} />
                  2. Masuk Vault
                </div>
                <div style={{ color: selectedOrderDetail.status === 'Dikirim' || selectedOrderDetail.status === 'Selesai' ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }}>
                  <div style={{ height: '4px', background: selectedOrderDetail.status === 'Dikirim' || selectedOrderDetail.status === 'Selesai' ? 'var(--accent)' : 'rgba(255,255,255,0.2)', borderRadius: '2px', marginBottom: '4px' }} />
                  3. Lolos Kurasi
                </div>
                <div style={{ color: selectedOrderDetail.status === 'Selesai' ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }}>
                  <div style={{ height: '4px', background: selectedOrderDetail.status === 'Selesai' ? 'var(--accent)' : 'rgba(255,255,255,0.2)', borderRadius: '2px', marginBottom: '4px' }} />
                  4. Diterima
                </div>
              </div>
            </div>

            {/* Item Info Box */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                padding: '14px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                marginBottom: '18px',
              }}
            >
              <img
                src={selectedOrderDetail.shoeImage || '/shoes/dunk-low.svg'}
                alt={selectedOrderDetail.shoeName}
                style={{
                  width: '90px',
                  height: '90px',
                  objectFit: 'contain',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  padding: '6px',
                }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '800' }}>
                  {selectedOrderDetail.shoeBrand}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '2px 0 6px', color: 'var(--text-main)' }}>
                  {selectedOrderDetail.shoeName}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  Ukuran: <strong>{selectedOrderDetail.size}</strong> &bull; Kondisi: <strong>{selectedOrderDetail.condition}</strong>
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent)', marginTop: '4px' }}>
                  {formatRupiah(selectedOrderDetail.price)}
                </div>
              </div>
            </div>

            {/* Tracking Number Section */}
            <div
              style={{
                background: 'rgba(0, 223, 162, 0.05)',
                border: '1px solid rgba(0, 223, 162, 0.2)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                  Nomor Resi Pengiriman ({selectedOrderDetail.courier})
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', letterSpacing: '1px', marginTop: '2px' }}>
                  {selectedOrderDetail.trackingNumber}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyResi(selectedOrderDetail.trackingNumber)}
                style={{
                  background: 'var(--accent)',
                  color: '#000000',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Salin Resi
              </button>
            </div>

            {/* Authenticity Vault Certificate Badge */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
                border: '1px solid rgba(0, 223, 162, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(0, 223, 162, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'var(--accent)',
                  flexShrink: 0,
                }}
              >
                🛡️
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '13px', color: '#ffffff', display: 'block' }}>
                  ZedConsign 100% Authentic Guaranteed
                </strong>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Tag RFID/NFC Vault: <strong>{selectedOrderDetail.vaultVerificationTag}</strong> &bull; Diverifikasi oleh {selectedOrderDetail.verifiedBy}.
                </span>
              </div>
            </div>

            {/* Shipping & Payment Info Summary */}
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '16px',
                fontSize: '13px',
                lineHeight: '1.7',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Penerima:</span>
                <strong>{selectedOrderDetail.buyerName} ({selectedOrderDetail.buyerPhone})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Alamat:</span>
                <span style={{ textAlign: 'right', maxWidth: '300px' }}>{selectedOrderDetail.shippingAddress}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Harga Sepatu:</span>
                <strong>{formatRupiah(selectedOrderDetail.price)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Ongkos Kirim:</span>
                <strong>{formatRupiah(selectedOrderDetail.shippingCost)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Metode Bayar:</span>
                <span>{selectedOrderDetail.paymentMethod}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '2px dashed var(--border-color)',
                  paddingTop: '8px',
                  marginTop: '8px',
                  fontSize: '15px',
                  fontWeight: '900',
                  color: 'var(--accent)',
                }}
              >
                <span>Total Lunas:</span>
                <span>{formatRupiah(selectedOrderDetail.price + selectedOrderDetail.shippingCost)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  window.print()
                }}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                🖨️ Cetak Invoice
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderDetail(null)}
                className="btn-primary"
                style={{ flex: 1, padding: '10px' }}
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
