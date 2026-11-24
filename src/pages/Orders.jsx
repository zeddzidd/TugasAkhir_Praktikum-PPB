import { useState, useEffect, useMemo } from 'react'
import { formatRupiah } from '../data/shoes.js'
import { isAdminUser } from '../lib/supabase.js'
import { getAllOrders, updateOrder } from '../lib/orders.js'

function Orders({ onNavigateCatalog, currentUser, onOpenAuth }) {
  const isAdmin = isAdminUser(currentUser)

  const [orders, setOrders] = useState(() => getAllOrders())
  const [adminViewMode, setAdminViewMode] = useState('all') // 'all' (semua pesanan toko) | 'my' (pesanan pribadi admin)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null)
  const [copyToast, setCopyToast] = useState(false)
  const [quickDispatchOrder, setQuickDispatchOrder] = useState(null)
  const [quickResi, setQuickResi] = useState('')
  const [quickCourier, setQuickCourier] = useState('JNE Express x ZedConsign')
  const [ordersToast, setOrdersToast] = useState('')

  // Sync orders dynamically on window events
  useEffect(() => {
    const handleReload = () => {
      setOrders(getAllOrders())
    }
    window.addEventListener('zedconsign_orders_updated', handleReload)
    window.addEventListener('storage', handleReload)
    return () => {
      window.removeEventListener('zedconsign_orders_updated', handleReload)
      window.removeEventListener('storage', handleReload)
    }
  }, [])

  // Filter pesanan hanya milik user yang sedang login
  const myOrders = useMemo(() => {
    if (!currentUser) return []
    return orders.filter((order) => {
      if (order.userId && order.userId === currentUser.id) return true
      if (order.userEmail && order.userEmail.toLowerCase() === currentUser.email?.toLowerCase()) return true
      if (order.buyerPhone && currentUser.phone && order.buyerPhone === currentUser.phone) return true
      if (order.buyerName && currentUser.fullName && order.buyerName.toLowerCase() === currentUser.fullName.toLowerCase()) return true
      return false
    })
  }, [orders, currentUser])

  // =========================================================================
  // KONDISI 1: JIKA BELUM LOGIN -> TAMPILKAN EMPTY STATE KUNCI LOGIN
  // =========================================================================
  if (!currentUser) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto 80px', padding: '0 16px', textAlign: 'center' }}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '48px 24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.1)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 20px',
            }}
          >
            🔒
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 10px', color: 'var(--text-main)' }}>
            Belum Ada Pesanan
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-dim)',
              margin: '0 auto 28px',
              maxWidth: '420px',
              lineHeight: '1.6',
            }}
          >
            Anda belum masuk ke akun. Silakan masuk atau daftar terlebih dahulu untuk melihat daftar pesanan,
            status verifikasi kurasi Vault, dan nomor resi pengiriman Anda.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onOpenAuth && onOpenAuth('login')}
              style={{ padding: '12px 28px', fontSize: '14px' }}
            >
              Masuk / Daftar Akun
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onNavigateCatalog}
              style={{ padding: '12px 24px', fontSize: '14px' }}
            >
              Jelajahi Katalog
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Tentukan basis list pesanan:
  // Jika Admin & mode 'all': tampilkan seluruh pesanan toko
  // Jika User biasa atau admin mode 'my': tampilkan pesanan pribadi
  const activeBaseOrders = isAdmin && adminViewMode === 'all' ? orders : myOrders

  // =========================================================================
  // KONDISI 2: USER BIASA SUDAH LOGIN TAPI BELUM PERNAH MEMESAN -> KOSONG
  // =========================================================================
  if (!isAdmin && myOrders.length === 0) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto 80px', padding: '0 16px', textAlign: 'center' }}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '48px 24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(0, 223, 162, 0.1)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 20px',
            }}
          >
            🛍️
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 10px', color: 'var(--text-main)' }}>
            Belum Ada Riwayat Pesanan
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-dim)',
              margin: '0 auto 28px',
              maxWidth: '440px',
              lineHeight: '1.6',
            }}
          >
            Halo, <strong>{currentUser.fullName || currentUser.email}</strong>! Anda belum melakukan pemesanan
            sepatu apapun. Silakan checkout produk pilihan Anda di katalog untuk mulai memantau pesanan di sini.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={onNavigateCatalog}
            style={{ padding: '12px 28px', fontSize: '14px' }}
          >
            Mulai Belanja di Katalog Sepatu
          </button>
        </div>
      </div>
    )
  }

  // Filter berdasarkan search query dan tab status
  const filteredOrders = activeBaseOrders.filter((order) => {
    const matchStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'Vault' &&
        (order.status?.toLowerCase().includes('vault') ||
          order.status?.toLowerCase().includes('menunggu') ||
          order.status?.toLowerCase().includes('proses'))) ||
      (selectedStatus === 'Dikirim' &&
        (order.status === 'Sedang Dikirim' ||
          order.status === 'Dikirim' ||
          order.status?.toLowerCase().includes('kirim'))) ||
      (selectedStatus === 'Selesai' && order.status === 'Selesai')

    const q = searchQuery.toLowerCase().trim()
    const matchQuery =
      !q ||
      order.shoeName?.toLowerCase().includes(q) ||
      order.id?.toLowerCase().includes(q) ||
      order.trackingNumber?.toLowerCase().includes(q) ||
      order.buyerName?.toLowerCase().includes(q) ||
      order.userEmail?.toLowerCase().includes(q)

    return matchStatus && matchQuery
  })

  const handleCopyResi = (resi) => {
    if (!resi) return
    navigator.clipboard.writeText(resi)
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 2000)
  }

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Selesai':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' }
      case 'Sedang Dikirim':
      case 'Dikirim':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' }
      case 'Menunggu ACC & Kirim Vault':
      case 'Diproses di Vault':
        return { bg: '#fef3c7', color: '#d97706', border: '#fde68a' }
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }
    }
  }

  // Quick dispatch from Orders page
  const handleOpenQuickDispatch = (order) => {
    setQuickDispatchOrder(order)
    setQuickCourier(order.courier || 'JNE Express x ZedConsign')
    setQuickResi(order.trackingNumber || `ZC-EXP-${Math.floor(100000 + Math.random() * 900000)}ID`)
  }

  const handleConfirmQuickDispatch = (e) => {
    e.preventDefault()
    if (!quickDispatchOrder) return
    const resi = quickResi.trim() || `ZC-EXP-${Math.floor(100000 + Math.random() * 900000)}ID`
    const nowTime =
      new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) +
      ', ' +
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
      ' WIB'

    updateOrder(quickDispatchOrder.id, {
      status: 'Sedang Dikirim',
      deliveryStatus: 'Sedang Dikirim',
      courier: quickCourier,
      trackingNumber: resi,
      shippedAt: nowTime,
      shippedBy: currentUser?.fullName || 'Admin Shiddiq Yazid',
    })

    setOrders(getAllOrders())
    setOrdersToast(`✓ Perintah Kirim Berhasil! Resi: ${resi}`)
    setTimeout(() => setOrdersToast(''), 4000)
    setQuickDispatchOrder(null)
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

      {ordersToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '9999px',
            fontWeight: '700',
            fontSize: '14px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: 9999,
          }}
        >
          {ordersToast}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
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

          {/* Admin Toggle: Semua Pesanan vs Pesanan Saya */}
          {isAdmin && (
            <div
              style={{
                background: 'rgba(255,255,255,0.08)',
                padding: '4px',
                borderRadius: '10px',
                display: 'flex',
                gap: '4px',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <button
                type="button"
                onClick={() => setAdminViewMode('all')}
                style={{
                  background: adminViewMode === 'all' ? 'var(--accent)' : 'transparent',
                  color: adminViewMode === 'all' ? '#000000' : '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '7px',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                📋 Semua Pesanan Toko ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setAdminViewMode('my')}
                style={{
                  background: adminViewMode === 'my' ? 'var(--accent)' : 'transparent',
                  color: adminViewMode === 'my' ? '#000000' : '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '7px',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                👤 Pesanan Saya ({myOrders.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Information Banner if Admin View */}
      {isAdmin && adminViewMode === 'all' && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(0, 223, 162, 0.1) 0%, rgba(3, 105, 161, 0.1) 100%)',
            border: '1px solid rgba(0, 223, 162, 0.3)',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e2e8f0' }}>
            <span>🛡️</span>
            <span>
              <strong>Mode Administrator Vault:</strong> Menampilkan seluruh pesanan masuk dari pembeli di toko. Anda dapat memantau status atau langsung menerbitkan perintah kirim sepatu.
            </span>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '800',
              background: '#00dfa2',
              color: '#0f172a',
              padding: '3px 10px',
              borderRadius: '9999px',
            }}
          >
            {orders.length} TOTAL PESANAN TOKO
          </span>
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
            { id: 'Vault', label: '⏳ Vault Autentikasi' },
            { id: 'Dikirim', label: '🚚 Sedang Dikirim' },
            { id: 'Selesai', label: '✅ Selesai' },
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
            placeholder="Cari nama sepatu, ID, resi, pembeli..."
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
            const isPendingShipment =
              order.status === 'Menunggu ACC & Kirim Vault' ||
              order.status === 'Diproses di Vault' ||
              order.status?.toLowerCase().includes('menunggu')

            return (
              <div
                key={order.id}
                style={{
                  background: 'var(--bg-card)',
                  border: isPendingShipment ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '20px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
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
                    {isAdmin && order.userEmail && (
                      <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', color: '#94a3b8' }}>
                        Pembeli: {order.buyerName || order.userEmail}
                      </span>
                    )}
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
                    {order.trackingNumber && (
                      <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '4px', fontWeight: '700' }}>
                        Resi ({order.courier}): {order.trackingNumber}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '150px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Total Transaksi:</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent)', marginBottom: '8px' }}>
                      {formatRupiah(order.price + order.shippingCost)}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {isAdmin && isPendingShipment && (
                        <button
                          type="button"
                          onClick={() => handleOpenQuickDispatch(order)}
                          style={{
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                          }}
                        >
                          🚀 Kirim Sepatu
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedOrderDetail(order)}
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
            Tidak ada riwayat transaksi pada filter ini.
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
              {(() => {
                const isShipped =
                  selectedOrderDetail.status === 'Sedang Dikirim' ||
                  selectedOrderDetail.status === 'Dikirim' ||
                  selectedOrderDetail.status === 'Selesai'
                const isCompleted = selectedOrderDetail.status === 'Selesai'

                return (
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
                    <div style={{ color: isShipped ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }}>
                      <div
                        style={{
                          height: '4px',
                          background: isShipped ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                          borderRadius: '2px',
                          marginBottom: '4px',
                        }}
                      />
                      3. ACC &amp; Dikirim
                    </div>
                    <div style={{ color: isCompleted ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }}>
                      <div
                        style={{
                          height: '4px',
                          background: isCompleted ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                          borderRadius: '2px',
                          marginBottom: '4px',
                        }}
                      />
                      4. Diterima
                    </div>
                  </div>
                )
              })()}
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
                  Nomor Resi Pengiriman ({selectedOrderDetail.courier || 'Ekspedisi Rekanan'})
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', letterSpacing: '1px', marginTop: '2px' }}>
                  {selectedOrderDetail.trackingNumber || 'Menunggu terbit resi Vault'}
                </div>
              </div>

              {selectedOrderDetail.trackingNumber && (
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
              )}
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
                  Tag RFID/NFC Vault: <strong>{selectedOrderDetail.vaultVerificationTag}</strong> &bull; Diverifikasi oleh {selectedOrderDetail.verifiedBy || 'Tim Kurator Vault'}.
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

      {/* QUICK DISPATCH MODAL IN ORDERS PAGE */}
      {quickDispatchOrder && (
        <div className="modal-overlay" onClick={() => setQuickDispatchOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '92%' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: '18px' }}>
                🚀 Kirim Sepatu &amp; Terbitkan Resi
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setQuickDispatchOrder(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmQuickDispatch} className="modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px', fontSize: '13px' }}>
                <div>Pesanan: <strong>{quickDispatchOrder.id}</strong></div>
                <div>Sepatu: <strong>{quickDispatchOrder.shoeName}</strong> ({quickDispatchOrder.size})</div>
                <div>Penerima: <strong>{quickDispatchOrder.buyerName}</strong></div>
              </div>

              <div className="form-group">
                <label className="form-label">Kurir Ekspedisi</label>
                <select
                  className="form-select"
                  value={quickCourier}
                  onChange={(e) => setQuickCourier(e.target.value)}
                >
                  <option value="JNE Express x ZedConsign">JNE Express x ZedConsign</option>
                  <option value="SiCepat Cargo & Reguler">SiCepat Cargo &amp; Reguler</option>
                  <option value="J&T Express Super">J&amp;T Express Super</option>
                  <option value="ZedConsign Vault Courier Express">ZedConsign Vault Courier Express</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Resi (AWB)</label>
                <input
                  type="text"
                  className="form-input"
                  value={quickResi}
                  onChange={(e) => setQuickResi(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setQuickDispatchOrder(null)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Kirim Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
