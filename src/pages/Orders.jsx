import { useState, useEffect, useMemo } from 'react'
import { formatRupiah } from '../data/shoes.js'
import { isAdminUser } from '../lib/supabase.js'
import { getAllOrders, updateOrder, fetchOrdersFromSupabase } from '../lib/orders.js'

function Orders({ onNavigateCatalog, currentUser, onOpenAuth }) {
  const isAdmin = isAdminUser(currentUser)

  const [orders, setOrders] = useState(() => getAllOrders())
  const [adminViewMode, setAdminViewMode] = useState('my') // Default ke 'my' (Pesanan Pembelian Saya) agar hanya menampilkan objek yang dibeli user, bukan SEMUA pesanan toko
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null)
  const [copyToast, setCopyToast] = useState(false)
  const [quickDispatchOrder, setQuickDispatchOrder] = useState(null)
  const [quickResi, setQuickResi] = useState('')
  const [quickCourier, setQuickCourier] = useState('JNE Express x ZedConsign')
  const [ordersToast, setOrdersToast] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)

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

  // Auto-sync orders with Supabase cloud (pull orders from laptop to HP or vice versa)
  useEffect(() => {
    async function syncCloud() {
      setIsSyncing(true)
      try {
        const cloudList = await fetchOrdersFromSupabase(currentUser)
        if (Array.isArray(cloudList)) {
          setOrders(cloudList)
        }
      } catch (err) {
        console.warn('Sync orders warning:', err)
      } finally {
        setIsSyncing(false)
      }
    }
    syncCloud()
  }, [currentUser])

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      const cloudList = await fetchOrdersFromSupabase(currentUser)
      if (Array.isArray(cloudList)) {
        setOrders(cloudList)
        setOrdersToast('✓ Pesanan berhasil disinkronkan dari Cloud!')
        setTimeout(() => setOrdersToast(''), 3000)
      }
    } catch {
      setOrdersToast('Gagal sinkronisasi cloud.')
      setTimeout(() => setOrdersToast(''), 3000)
    } finally {
      setIsSyncing(false)
    }
  }

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
    const isPending =
      order.status === 'Menunggu ACC Vault' ||
      order.status === 'Menunggu ACC & Kirim Vault' ||
      order.status === 'Diproses di Vault' ||
      order.status?.toLowerCase().includes('menunggu') ||
      order.status?.toLowerCase().includes('vault') ||
      order.status?.toLowerCase().includes('proses')

    const isShipped =
      !isPending &&
      (order.status === 'Sedang Dikirim' ||
        order.status === 'Dikirim' ||
        order.status === 'Dalam Pengiriman' ||
        order.status?.toLowerCase().includes('kirim'))

    const isCompleted = order.status === 'Selesai'

    const matchStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'Vault' && isPending) ||
      (selectedStatus === 'Dikirim' && isShipped) ||
      (selectedStatus === 'Selesai' && isCompleted)

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
      case 'Dalam Pengiriman':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' }
      case 'Menunggu ACC Vault':
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

          {/* Admin Toggle: Pesanan Saya vs Semua Pesanan Toko */}
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
                👤 Pesanan Pembelian Saya ({myOrders.length})
              </button>
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
                📋 Semua Transaksi Toko ({orders.length})
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

        {/* Search Input & Cloud Sync Button */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: '260px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Cari nama sepatu, ID, resi, pembeli..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ margin: 0, flex: 1 }}
          />
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            title="Sinkronkan Pesanan dari Cloud (Laptop / HP)"
            style={{
              padding: '8px 12px',
              borderRadius: '9px',
              border: '1px solid var(--border-color)',
              background: isSyncing ? '#f1f5f9' : 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <span>{isSyncing ? '🔄' : '☁️'}</span>
            <span className="hide-on-mobile">{isSyncing ? 'Sinkron...' : 'Sinkronkan'}</span>
          </button>
        </div>
      </div>

      {/* Orders List Grid */}
      {filteredOrders.length > 0 ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredOrders.map((order) => {
            const statusStyle = getStatusBadgeStyle(order.status)
            const isPendingShipment =
              order.status === 'Menunggu ACC Vault' ||
              order.status === 'Menunggu ACC & Kirim Vault' ||
              order.status === 'Diproses di Vault' ||
              order.status?.toLowerCase().includes('menunggu') ||
              order.status?.toLowerCase().includes('vault')

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
                    src={order.shoeImage || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 84 84"><rect width="84" height="84" fill="%23f1f5f9"/><text x="42" y="48" font-family="Arial" font-size="26" fill="%2394a3b8" text-anchor="middle">👟</text></svg>'}
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
                      e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 84 84"><rect width="84" height="84" fill="%23f1f5f9"/><text x="42" y="48" font-family="Arial" font-size="26" fill="%2394a3b8" text-anchor="middle">👟</text></svg>'
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
                    {order.paymentProof && (
                      <div style={{ fontSize: '11.5px', color: '#00dfa2', marginTop: '4px', fontWeight: '800' }}>
                        📷 Bukti Transfer Terlampir
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
      {selectedOrderDetail && (() => {
        const rawStatus = selectedOrderDetail.status || 'Menunggu ACC Vault'
        const displayStatus =
          rawStatus === 'Menunggu ACC & Kirim Vault' ? 'Menunggu ACC Vault' : rawStatus
        const statusStyle = getStatusBadgeStyle(displayStatus)
        const isShipped =
          displayStatus === 'Sedang Dikirim' ||
          displayStatus === 'Dikirim' ||
          displayStatus === 'Dalam Pengiriman' ||
          displayStatus === 'Selesai'
        const isCompleted = displayStatus === 'Selesai'
        const orderDate = selectedOrderDetail.date || '24 November 2026'
        const totalAmount = (selectedOrderDetail.price || 0) + (selectedOrderDetail.shippingCost || 0)

        return (
          <div
            className="modal-overlay"
            onClick={() => setSelectedOrderDetail(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="order-detail-modal-card invoice-paper-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Tombol Tutup Mengambang di Pojok Kanan Atas */}
              <button
                type="button"
                className="invoice-close-float no-print"
                onClick={() => setSelectedOrderDetail(null)}
                title="Tutup Invoice"
              >
                &times;
              </button>

              {/* DOKUMEN FAKTUR INVOICE RESMI (TAMPIL DI LAYAR & HASIL CETAK A4) */}
              <div className="official-invoice-print-doc">
                {/* Header Invoice: ZED CONSIGN & FAKTUR INVOICE RESMI */}
                <div className="print-invoice-header">
                  <div>
                    <h1 className="print-logo-brand">ZED CONSIGN</h1>
                  </div>
                  <div className="print-invoice-title-block">
                    <h2 className="print-invoice-title">FAKTUR INVOICE RESMI</h2>
                    <div className="print-invoice-number">NO: {selectedOrderDetail.id}</div>
                    <div style={{ fontSize: '9pt', color: '#475569', marginTop: '2px' }}>
                      Tanggal: {orderDate}
                    </div>
                    <div className="print-badge-paid">
                      {isCompleted
                        ? '✓ SELESAI • DITERIMA'
                        : isShipped
                        ? '🚚 SEDANG DIKIRIM'
                        : '✓ LUNAS • VERIFIED ESCROW'}
                    </div>
                  </div>
                </div>

                {/* Data Pembeli & Transaksi 2 Kolom */}
                <div className="print-parties-grid">
                  <div className="print-party-col">
                    <h4>Ditujukan Kepada (Penerima):</h4>
                    <p><strong>Nama:</strong> {selectedOrderDetail.buyerName || 'Pelanggan Terhormat'}</p>
                    <p><strong>Kontak / HP:</strong> {selectedOrderDetail.buyerPhone || '-'}</p>
                    <p><strong>Alamat Pengiriman:</strong> {selectedOrderDetail.shippingAddress || '-'}</p>
                    <p><strong>Jasa Ekspedisi:</strong> {selectedOrderDetail.courier || 'SiCepat Cargo Reguler'}</p>
                  </div>
                  <div className="print-party-col">
                    <h4>Detail Transaksi &amp; Vault:</h4>
                    <p><strong>Nomor Invoice:</strong> {selectedOrderDetail.id}</p>
                    <p><strong>Metode Pembayaran:</strong> {selectedOrderDetail.paymentMethod || 'QRIS Instant BCA'}</p>
                    <p>
                      <strong>Nomor Resi Vault:</strong>{' '}
                      <strong>{selectedOrderDetail.trackingNumber || 'Dalam Proses Packing Vault'}</strong>
                      {selectedOrderDetail.trackingNumber && (
                        <button
                          type="button"
                          className="btn-copy-resi-mini no-print"
                          onClick={() => handleCopyResi(selectedOrderDetail.trackingNumber)}
                          title="Salin nomor resi pengiriman"
                        >
                          {copyToast ? '✓ Disalin' : 'Salin'}
                        </button>
                      )}
                    </p>
                    <p><strong>Security Tag RFID:</strong> {selectedOrderDetail.vaultVerificationTag || 'ZC-AUTH-VAULT'}</p>
                  </div>
                </div>

                {/* Tabel Rincian Produk */}
                <table className="print-table">
                  <thead>
                    <tr>
                      <th style={{ width: '6%', textAlign: 'center' }}>NO</th>
                      <th style={{ width: '44%' }}>DESKRIPSI PRODUK &amp; SEPATU</th>
                      <th style={{ width: '16%' }}>UKURAN</th>
                      <th style={{ width: '16%' }}>KONDISI</th>
                      <th style={{ width: '18%', textAlign: 'right' }}>HARGA SATUAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>1</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {selectedOrderDetail.shoeImage && (
                            <img
                              src={selectedOrderDetail.shoeImage}
                              alt=""
                              style={{ width: '40px', height: '40px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f8fafc' }}
                            />
                          )}
                          <div>
                            <strong>{selectedOrderDetail.shoeBrand}</strong> - {selectedOrderDetail.shoeName}
                            <div style={{ fontSize: '8pt', color: '#64748b' }}>Autentikasi: Lolos Verifikasi Fisik 12 Titik Kurator Vault</div>
                          </div>
                        </div>
                      </td>
                      <td><strong>{selectedOrderDetail.size}</strong></td>
                      <td>{selectedOrderDetail.condition}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(selectedOrderDetail.price)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Ringkasan Biaya & Stempel Keaslian */}
                <div className="print-bottom-grid">
                  <div className="print-vault-stamp-box">
                    <div className="print-stamp-title">
                      🛡️ ZEDCONSIGN 100% AUTHENTIC GUARANTEED
                    </div>
                    <div className="print-stamp-text">
                      Sepatu ini telah melalui uji kurasi fisik resmi oleh Tim Kurator ZedConsign Vault (pemeriksaan box, barcode label, stitching jahitan, insole, out-sole, dan material UV).
                    </div>
                    <div style={{ fontSize: '8pt', color: '#166534', marginTop: '2px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <span>RFID ID: <strong>{selectedOrderDetail.vaultVerificationTag}</strong></span>
                      <span>Chief Curator: <strong>Shiddiq Yazid (Vault ID: 041)</strong></span>
                    </div>
                    {selectedOrderDetail.paymentProof && (
                      <div style={{ marginTop: '4px', fontSize: '7.5pt', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Bukti Bayar: Terlampir &bull; Sah diverifikasi sistem kasir digital.</span>
                      </div>
                    )}
                  </div>

                  <div className="print-ledger-box">
                    <div className="print-ledger-row">
                      <span>Subtotal Produk:</span>
                      <span>{formatRupiah(selectedOrderDetail.price)}</span>
                    </div>
                    <div className="print-ledger-row">
                      <span>Ongkos Kirim ({selectedOrderDetail.courier?.split(' ')[0] || 'Ekspedisi'}):</span>
                      <span>{formatRupiah(selectedOrderDetail.shippingCost || 0)}</span>
                    </div>
                    <div className="print-ledger-row">
                      <span>Biaya Autentikasi Vault:</span>
                      <span style={{ color: '#059669', fontWeight: 'bold' }}>GRATIS (Rp 0)</span>
                    </div>
                    <div className="print-ledger-row">
                      <span>Asuransi Kehilangan:</span>
                      <span style={{ color: '#059669', fontWeight: 'bold' }}>Ditanggung ZedConsign</span>
                    </div>
                    <div className="print-ledger-total-row">
                      <span>TOTAL LUNAS:</span>
                      <span>{formatRupiah(totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Catatan Kaki & Tanda Tangan */}
                <div className="print-footer-disclaimer">
                  <div style={{ maxWidth: '65%' }}>
                    <strong>Ketentuan Transaksi &amp; Garansi Autentikasi:</strong><br />
                    1. Faktur ini sah diterbitkan secara elektronik oleh sistem ZedConsign PWA tanpa memerlukan tanda tangan basah.<br />
                    2. Garansi uang kembali 100% jika unit terbukti tidak autentik oleh kurator independen terakreditasi.<br />
                    3. Simpan faktur ini dan sertifikat Vault Passport untuk klaim layanan atau titip jual kembali (resell) di masa mendatang.
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '8pt', color: '#64748b' }}>Dicetak pada:</div>
                    <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#0f172a' }}>
                      {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '8pt', fontWeight: '800', color: '#006b52' }}>
                      [ SYSTEM VERIFIED &bull; ZEDCONSIGN VAULT ]
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi di Layar (Sembunyi Saat Cetak) */}
                <div className="invoice-modal-actions no-print">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="od-btn-print"
                    title="Cetak Faktur / Simpan sebagai PDF A4"
                  >
                    🖨️ Cetak / Unduh PDF (A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderDetail(null)}
                    className="od-btn-close"
                  >
                    Tutup Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
