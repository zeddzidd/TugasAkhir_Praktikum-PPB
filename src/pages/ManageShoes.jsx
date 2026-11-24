import { useState, useMemo } from 'react'
import { formatRupiah, CATEGORIES } from '../data/shoes.js'
import ImageUploader from '../components/ImageUploader.jsx'
import { isAdminUser } from '../lib/supabase.js'

const PRESET_IMAGES = [
  { label: 'Air Max Goadome Foam', value: '/shoes/goadome-foam.svg' },
  { label: 'Jordan Retro High', value: '/shoes/jordan-retro.svg' },
  { label: 'Nike Dunk Low', value: '/shoes/dunk-low.svg' },
  { label: 'Yeezy Boost 350', value: '/shoes/yeezy-boost.svg' },
  { label: 'New Balance 990', value: '/shoes/new-balance.svg' },
  { label: 'Adidas Samba OG', value: '/shoes/samba-og.svg' },
  { label: 'Travis Scott AJ1', value: '/shoes/travis-scott.svg' },
]

const INITIAL_FORM = {
  name: '',
  brand: 'Nike',
  category: 'Sneakers',
  size: 'US 9 / EU 42.5',
  condition: 'Brand New In Box (BNIB)',
  price: '',
  image: '',
  images: [],
  stock: 1,
  consignor: 'ZedConsign Verified Seller',
  description: '',
  isExpress: true,
  isFeatured: true,
  authStatus: 'verified',
}

function ManageShoes({
  shoes,
  onAddShoe,
  onUpdateShoe,
  onDeleteShoe,
  onResetDefault,
  onSyncSupabase,
  currentUser,
  onOpenAuth,
  onNavigateConsign,
  onNavigateCatalog,
  onSwitchToAdmin,
}) {
  const isAdmin = isAdminUser(currentUser)

  // Admin View State
  const [adminTab, setAdminTab] = useState('vault') // 'vault' | 'inventory'
  const [vaultFilter, setVaultFilter] = useState('all') // 'all' | 'pending' | 'verified' | 'rejected'
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShoe, setEditingShoe] = useState(null)
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedDetailShoe, setSelectedDetailShoe] = useState(null)
  const [adminToast, setAdminToast] = useState('')

  // Submissions and Status Categorization
  const pendingShoes = useMemo(
    () => shoes.filter((s) => s.authStatus === 'pending'),
    [shoes]
  )
  const verifiedShoes = useMemo(
    () => shoes.filter((s) => s.authStatus === 'verified' || !s.authStatus),
    [shoes]
  )
  const rejectedShoes = useMemo(
    () => shoes.filter((s) => s.authStatus === 'rejected'),
    [shoes]
  )
  const consignSubmissions = useMemo(
    () => shoes.filter((s) => (s.id && s.id.startsWith('consign-')) || s.authStatus === 'pending' || s.authStatus === 'rejected'),
    [shoes]
  )

  // Vault Tab Filtered List
  const vaultDisplayShoes = useMemo(() => {
    let list = consignSubmissions.length > 0 ? consignSubmissions : shoes
    if (vaultFilter === 'pending') {
      list = shoes.filter((s) => s.authStatus === 'pending')
    } else if (vaultFilter === 'verified') {
      list = shoes.filter((s) => s.authStatus === 'verified' || !s.authStatus)
    } else if (vaultFilter === 'rejected') {
      list = shoes.filter((s) => s.authStatus === 'rejected')
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.brand.toLowerCase().includes(q) ||
          (s.consignor && s.consignor.toLowerCase().includes(q))
      )
    }
    return list
  }, [shoes, consignSubmissions, vaultFilter, search])

  // Inventory Tab Statistics & Filtered
  const totalItems = shoes.length
  const totalStock = shoes.reduce((acc, s) => acc + (Number(s.stock) || 1), 0)
  const totalInventoryValue = shoes.reduce(
    (acc, s) => acc + (Number(s.price) || 0) * (Number(s.stock) || 1),
    0
  )

  const inventoryFilteredShoes = useMemo(() => {
    return shoes.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.brand.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        (s.consignor && s.consignor.toLowerCase().includes(search.toLowerCase()))
    )
  }, [shoes, search])

  // Handle ACC Vault
  const handleAccVault = (shoe) => {
    const updated = {
      ...shoe,
      authStatus: 'verified',
      verifiedAt: new Date().toISOString(),
      verifiedBy: currentUser?.fullName || 'Admin Shiddiq Yazid',
      stock: Number(shoe.stock) > 0 ? Number(shoe.stock) : 1,
    }
    onUpdateShoe(updated)
    setAdminToast(`✓ Sepatu "${shoe.name}" berhasil di-ACC & Terverifikasi Vault! Langsung aktif di katalog publik.`)
    setTimeout(() => setAdminToast(''), 4500)
  }

  // Handle Reject Vault
  const handleRejectVault = (shoe) => {
    if (window.confirm(`Tolak verifikasi autentikasi sepatu "${shoe.name}"?`)) {
      const updated = {
        ...shoe,
        authStatus: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: currentUser?.fullName || 'Admin Shiddiq Yazid',
      }
      onUpdateShoe(updated)
      setAdminToast(`Sepatu "${shoe.name}" ditolak dari kurasi Vault.`)
      setTimeout(() => setAdminToast(''), 4500)
    }
  }

  // Modal Open Handlers
  const handleOpenAddModal = () => {
    setEditingShoe(null)
    setFormData({
      ...INITIAL_FORM,
      consignor: currentUser?.fullName ? `${currentUser.fullName} (Admin)` : 'ZedConsign Vault Admin',
    })
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (shoe) => {
    setEditingShoe(shoe)
    const shoeImgs =
      Array.isArray(shoe.images) && shoe.images.length > 0
        ? shoe.images
        : [shoe.image || '/shoes/dunk-low.svg']

    setFormData({
      name: shoe.name,
      brand: shoe.brand,
      category: shoe.category,
      size: shoe.size,
      condition: shoe.condition,
      price: shoe.price,
      image: shoeImgs[0] || '/shoes/dunk-low.svg',
      images: shoeImgs,
      stock: shoe.stock || 1,
      consignor: shoe.consignor || 'ZedConsign Verified Seller',
      description: shoe.description || '',
      isExpress: Boolean(shoe.isExpress),
      isFeatured: Boolean(shoe.isFeatured),
      authStatus: shoe.authStatus || 'verified',
    })
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setErrorMsg('Nama sepatu wajib diisi!')
      return
    }
    const priceNum = Number(formData.price)
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('Harga harus berupa angka lebih dari 0!')
      return
    }
    const stockNum = Number(formData.stock)
    if (isNaN(stockNum) || stockNum < 1) {
      setErrorMsg('Stok minimal 1 unit!')
      return
    }

    const finalImages =
      Array.isArray(formData.images) && formData.images.length > 0
        ? formData.images
        : [formData.image || '/shoes/dunk-low.svg']
    const primaryImage = finalImages[0] || '/shoes/dunk-low.svg'

    if (editingShoe) {
      onUpdateShoe({
        ...editingShoe,
        ...formData,
        image: primaryImage,
        images: finalImages,
        price: priceNum,
        stock: stockNum,
      })
      setAdminToast(`✓ Data sepatu "${formData.name}" berhasil diperbarui!`)
      setTimeout(() => setAdminToast(''), 4500)
    } else {
      const newShoe = {
        id: `shoe-${Date.now()}`,
        ...formData,
        image: primaryImage,
        images: finalImages,
        price: priceNum,
        stock: stockNum,
        authStatus: 'verified',
        verifiedAt: new Date().toISOString(),
        verifiedBy: currentUser?.fullName || 'Admin Shiddiq Yazid',
      }
      onAddShoe(newShoe)
      setAdminToast(`✓ Sepatu baru "${newShoe.name}" berhasil ditambahkan ke inventaris Vault!`)
      setTimeout(() => setAdminToast(''), 4500)
    }

    setIsModalOpen(false)
  }

  const confirmDelete = () => {
    if (deleteCandidate) {
      onDeleteShoe(deleteCandidate.id)
      setAdminToast(`Sepatu "${deleteCandidate.name}" berhasil dihapus dari inventaris.`)
      setTimeout(() => setAdminToast(''), 4500)
      setDeleteCandidate(null)
    }
  }

  // ===========================================================================
  // CASE A: User Biasa / Non-Admin (User Gabisa Kelola Barang)
  // ===========================================================================
  if (!isAdmin) {
    return (
      <div className="manage-page-container" style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 16px' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
            padding: '36px 28px',
            textAlign: 'center',
          }}
        >
          {/* Lock Icon */}
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: '#fef2f2',
              border: '2px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
            }}
          >
            🔒
          </div>

          <span
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: '800',
              color: '#dc2626',
              background: '#fee2e2',
              padding: '4px 12px',
              borderRadius: '9999px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Akses Dibatasi &bull; Khusus Administrator
          </span>

          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
            Portal Admin Vault &amp; Kelola Barang
          </h2>

          <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', maxWidth: '620px', margin: '0 auto 24px' }}>
            Halaman ini dikhususkan bagi <strong>Administrator &amp; Tim Kurator ZedConsign Vault</strong> untuk memeriksa status keaslian fisik (Legit Check ACC) serta mengelola katalog inventaris sepatu toko.
            <br />
            {currentUser ? (
              <span style={{ display: 'inline-block', marginTop: '8px', color: '#0369a1', background: '#f0f9ff', padding: '6px 14px', borderRadius: '8px', fontSize: '13px' }}>
                Status Akun: <strong>Consignor / Pengguna Publik ({currentUser.fullName || currentUser.email})</strong>
              </span>
            ) : (
              <span style={{ display: 'inline-block', marginTop: '8px', color: '#b45309', background: '#fffbeb', padding: '6px 14px', borderRadius: '8px', fontSize: '13px' }}>
                Status Akun: <strong>Pengunjung / Tamu Belum Masuk</strong>
              </span>
            )}
          </p>

          {/* Role Access Comparison Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '28px',
            }}
          >
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Panduan Hak Akses Pengguna Publik:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '13px' }}>
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#047857', display: 'block', marginBottom: '2px' }}>✅ Ajukan Titip Jual (Sell)</strong>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Pengguna dapat mendaftarkan sepatu pribadi untuk diverifikasi dan di-ACC oleh Admin Vault.</span>
              </div>
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#047857', display: 'block', marginBottom: '2px' }}>✅ Beli Sepatu Authentic</strong>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Jelajahi dan beli sneakers yang telah 100% lolos ACC kurator resmi.</span>
              </div>
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#047857', display: 'block', marginBottom: '2px' }}>✅ Lacak Resi Pesanan</strong>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Pantau pengiriman resi sepatu di halaman menu Pesanan.</span>
              </div>
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #fee2e2' }}>
                <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '2px' }}>⛔ Kelola Barang Toko</strong>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Pengguna biasa tidak diizinkan menambah, mengubah, atau menghapus inventaris umum.</span>
              </div>
            </div>
          </div>

          {/* Action CTAs for User */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (onNavigateConsign) onNavigateConsign()
              }}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #0f172a 0%, #006b52 100%)',
                boxShadow: '0 4px 14px rgba(0, 107, 82, 0.3)',
              }}
            >
              🏷️ Ajukan Titip Jual Sepatu (Sell)
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (onNavigateCatalog) onNavigateCatalog()
              }}
              style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '700' }}
            >
              🏠 Kembali ke Beranda
            </button>

            {/* Quick Switch to Admin for Grading / Testing */}
            <button
              type="button"
              onClick={() => {
                if (onSwitchToAdmin) onSwitchToAdmin()
              }}
              style={{
                padding: '12px 20px',
                fontSize: '13px',
                fontWeight: '700',
                background: '#fef3c7',
                border: '1.5px solid #fde68a',
                color: '#92400e',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              title="Khusus Penguji / Asisten Praktikum: Masuk instan sebagai Admin Vault Shiddiq Yazid"
            >
              <span>🔑</span>
              <span>Beralih ke Akun Demo Admin (Shiddiq Yazid)</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===========================================================================
  // CASE B: Administrator View (Kelola Inventaris + Vault ACC)
  // ===========================================================================
  return (
    <div className="manage-page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Toast Notification */}
      {adminToast && (
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
          {adminToast}
        </div>
      )}

      {/* Admin Panel Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '800',
                background: '#00dfa2',
                color: '#0f172a',
                padding: '3px 10px',
                borderRadius: '9999px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              🛡️ ZEDCONSIGN VAULT ADMINISTRATOR
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Logged in: <strong>{currentUser?.fullName || 'Shiddiq Yazid (Admin)'}</strong>
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Portal Admin: Kelola Inventaris &amp; Vault Authentifikasi
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>
            Verifikasi legit check sepatu konsinyasi titip jual dan kelola seluruh katalog barang toko.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={handleOpenAddModal}
          style={{
            background: 'linear-gradient(135deg, #00dfa2 0%, #006b52 100%)',
            color: '#0f172a',
            fontWeight: '800',
            fontSize: '13.5px',
            padding: '10px 20px',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(0, 223, 162, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '16px' }}>+</span>
          <span>Tambah Sepatu Baru</span>
        </button>
      </div>

      {/* Admin Tab Switcher */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: '#f1f5f9',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <button
          type="button"
          onClick={() => setAdminTab('vault')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: adminTab === 'vault' ? '#ffffff' : 'transparent',
            color: adminTab === 'vault' ? '#006b52' : '#64748b',
            boxShadow: adminTab === 'vault' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>🛡️ Vault Authentifikasi (ACC Sepatu)</span>
          {pendingShoes.length > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '900',
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              {pendingShoes.length} Pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('inventory')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: adminTab === 'inventory' ? '#ffffff' : 'transparent',
            color: adminTab === 'inventory' ? '#0f172a' : '#64748b',
            boxShadow: adminTab === 'inventory' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>📦 Kelola Semua Inventaris</span>
          <span
            style={{
              background: '#e2e8f0',
              color: '#334155',
              fontSize: '11px',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            {shoes.length} Total
          </span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: VAULT AUTHENTIFIKASI (ACC SEPATU)
          ===================================================================== */}
      {adminTab === 'vault' && (
        <div>
          {/* Vault Metrics Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase' }}>
                ⏳ Menunggu ACC Vault
              </span>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#92400e', marginTop: '4px' }}>
                {pendingShoes.length} Pengajuan
              </div>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>
                ✅ Lolos &amp; Terverifikasi
              </span>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#065f46', marginTop: '4px' }}>
                {verifiedShoes.length} Sepatu
              </div>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#b91c1c', textTransform: 'uppercase' }}>
                ❌ Ditolak / Tidak Lolos
              </span>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#991b1b', marginTop: '4px' }}>
                {rejectedShoes.length} Unit
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                📦 Total Pengajuan Titip Jual
              </span>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
                {consignSubmissions.length} Pengajuan
              </div>
            </div>
          </div>

          {/* Filter Pills for Vault Submissions */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setVaultFilter('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12.5px',
                fontWeight: '700',
                border: vaultFilter === 'all' ? '2px solid #006b52' : '1px solid #cbd5e1',
                background: vaultFilter === 'all' ? '#006b52' : '#ffffff',
                color: vaultFilter === 'all' ? '#ffffff' : '#334155',
                cursor: 'pointer',
              }}
            >
              Semua Pengajuan ({consignSubmissions.length})
            </button>
            <button
              type="button"
              onClick={() => setVaultFilter('pending')}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12.5px',
                fontWeight: '700',
                border: vaultFilter === 'pending' ? '2px solid #b45309' : '1px solid #cbd5e1',
                background: vaultFilter === 'pending' ? '#fef3c7' : '#ffffff',
                color: vaultFilter === 'pending' ? '#92400e' : '#334155',
                cursor: 'pointer',
              }}
            >
              ⏳ Menunggu ACC Vault ({pendingShoes.length})
            </button>
            <button
              type="button"
              onClick={() => setVaultFilter('verified')}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12.5px',
                fontWeight: '700',
                border: vaultFilter === 'verified' ? '2px solid #047857' : '1px solid #cbd5e1',
                background: vaultFilter === 'verified' ? '#ecfdf5' : '#ffffff',
                color: vaultFilter === 'verified' ? '#065f46' : '#334155',
                cursor: 'pointer',
              }}
            >
              ✅ Terverifikasi ACC ({verifiedShoes.length})
            </button>
            <button
              type="button"
              onClick={() => setVaultFilter('rejected')}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12.5px',
                fontWeight: '700',
                border: vaultFilter === 'rejected' ? '2px solid #b91c1c' : '1px solid #cbd5e1',
                background: vaultFilter === 'rejected' ? '#fef2f2' : '#ffffff',
                color: vaultFilter === 'rejected' ? '#991b1b' : '#334155',
                cursor: 'pointer',
              }}
            >
              ❌ Ditolak ({rejectedShoes.length})
            </button>
          </div>

          {/* Submissions List */}
          {vaultDisplayShoes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {vaultDisplayShoes.map((shoe) => {
                const isPending = shoe.authStatus === 'pending'
                const isVerified = shoe.authStatus === 'verified' || !shoe.authStatus
                const isRejected = shoe.authStatus === 'rejected'

                return (
                  <div
                    key={shoe.id}
                    style={{
                      background: '#ffffff',
                      border: isPending ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Top Row: Thumbnail & Main Info */}
                    <div style={{ display: 'flex', gap: '14px', marginBottom: '12px' }}>
                      <img
                        src={(Array.isArray(shoe.images) && shoe.images[0]) || shoe.image || '/shoes/dunk-low.svg'}
                        alt={shoe.name}
                        onClick={() => setSelectedDetailShoe(shoe)}
                        style={{
                          width: '100px',
                          height: '80px',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '4px',
                          cursor: 'pointer',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isPending && (
                          <span style={{ fontSize: '10.5px', fontWeight: '800', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                            ⏳ MENUNGGU ACC VAULT
                          </span>
                        )}
                        {isVerified && (
                          <span style={{ fontSize: '10.5px', fontWeight: '800', background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                            ✓ VERIFIED BY VAULT
                          </span>
                        )}
                        {isRejected && (
                          <span style={{ fontSize: '10.5px', fontWeight: '800', background: '#fef2f2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                            ✕ DITOLAK
                          </span>
                        )}
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {shoe.name}
                        </h4>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {shoe.brand} &bull; {shoe.size}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#006b52', marginTop: '2px' }}>
                          {formatRupiah(shoe.price)}
                        </div>
                      </div>
                    </div>

                    {/* Metadata strip */}
                    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px 12px', fontSize: '11.5px', color: '#475569', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div>Consignor: <strong>{shoe.consignor || 'Verified Seller'}</strong></div>
                      <div>Kondisi: <strong>{shoe.condition}</strong></div>
                      {shoe.submittedAt && (
                        <div>Diajukan: {new Date(shoe.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      )}
                    </div>

                    {/* Action Buttons for Curator */}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAccVault(shoe)}
                            style={{
                              flex: 1,
                              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontWeight: '700',
                              fontSize: '12.5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                            }}
                          >
                            ✓ ACC &amp; Loloskan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectVault(shoe)}
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: '1px solid #fecaca',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontWeight: '700',
                              fontSize: '12.5px',
                              cursor: 'pointer',
                            }}
                          >
                            ✕ Tolak
                          </button>
                        </>
                      )}

                      {!isPending && (
                        <button
                          type="button"
                          onClick={() => (isVerified ? handleRejectVault(shoe) : handleAccVault(shoe))}
                          style={{
                            flex: 1,
                            background: isVerified ? '#f1f5f9' : '#ecfdf5',
                            color: isVerified ? '#64748b' : '#047857',
                            border: '1px solid #cbd5e1',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {isVerified ? 'Ubah ke Ditolak' : '✓ ACC Ulang'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedDetailShoe(shoe)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                        }}
                        title="Periksa foto detail & spesifikasi"
                      >
                        👁️ Periksa Foto
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '10px' }}>🎉</span>
              <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                Tidak Ada Antrean Pengajuan Vault
              </strong>
              <p style={{ fontSize: '13px', margin: 0 }}>
                Semua pengajuan sepatu konsinyasi titip jual telah diperiksa dan di-ACC oleh kurator Vault.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: KELOLA SEMUA INVENTARIS (CRUD TABLE)
          ===================================================================== */}
      {adminTab === 'inventory' && (
        <div>
          {/* Quick Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Model Terdaftar</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{totalItems} Model</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Total Pasang (Stok)</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#006b52' }}>{totalStock} Pasang</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Estimasi Nilai Inventaris</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{formatRupiah(totalInventoryValue)}</div>
            </div>
          </div>

          {/* Search Input */}
          <div style={{ marginBottom: '16px', maxWidth: '400px' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Cari data sepatu atau consignor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* CRUD Table */}
          <div className="table-container">
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Sepatu &amp; Model</th>
                  <th>Kategori</th>
                  <th>Size</th>
                  <th>Kondisi</th>
                  <th>Status Vault</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {inventoryFilteredShoes.length > 0 ? (
                  inventoryFilteredShoes.map((shoe) => (
                    <tr key={shoe.id}>
                      <td>
                        <div
                          className="table-shoe-cell"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDetailShoe(shoe)}
                          title="Klik untuk melihat detail lengkap sepatu"
                        >
                          <img
                            src={shoe.image || (Array.isArray(shoe.images) && shoe.images[0]) || '/shoes/dunk-low.svg'}
                            alt={shoe.name}
                            className="table-shoe-thumb"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = '/shoes/dunk-low.svg'
                            }}
                          />
                          <div>
                            <strong style={{ display: 'block', color: 'var(--text-main)' }}>{shoe.name}</strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                              {shoe.brand} &bull; {shoe.consignor || 'ZedConsign Vault'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            background: 'rgba(56, 189, 248, 0.1)',
                            color: 'var(--primary)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {shoe.category}
                        </span>
                      </td>
                      <td>{shoe.size}</td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{shoe.condition}</span>
                      </td>
                      <td>
                        {shoe.authStatus === 'pending' ? (
                          <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '800' }}>
                            ⏳ Menunggu ACC
                          </span>
                        ) : shoe.authStatus === 'rejected' ? (
                          <span style={{ background: '#fef2f2', color: '#991b1b', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '800' }}>
                            ✕ Ditolak
                          </span>
                        ) : (
                          <span style={{ background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '800' }}>
                            ✓ Authentic ACC
                          </span>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--accent)' }}>{formatRupiah(shoe.price)}</strong>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: shoe.stock > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: shoe.stock > 0 ? 'var(--success)' : 'var(--danger)',
                            fontSize: '12px',
                            fontWeight: '700',
                          }}
                        >
                          {shoe.stock} unit
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {shoe.authStatus === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleAccVault(shoe)}
                              style={{
                                background: '#059669',
                                color: '#fff',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                              }}
                              title="Langsung ACC Sepatu Ini"
                            >
                              ✓ ACC
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => setSelectedDetailShoe(shoe)}
                            title="Lihat detail lengkap inventaris sepatu"
                          >
                            👁️ Detail
                          </button>
                          <button
                            type="button"
                            className="btn-edit"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => handleOpenEditModal(shoe)}
                            title="Edit data sepatu ini"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-danger"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => setDeleteCandidate(shoe)}
                            title="Hapus sepatu dari katalog"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                      Tidak ada data sepatu yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD / EDIT FORM
          ===================================================================== */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingShoe ? 'Edit Data Sepatu' : 'Tambah Sepatu Baru ke Inventaris'}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              {errorMsg && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--danger)',
                    color: '#fca5a5',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '16px',
                    fontSize: '13px',
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Nama Sepatu / Model *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Air Jordan 1 Low Travis Scott Reverse Mocha"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Brand *</label>
                  <select
                    className="form-select"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  >
                    <option value="Nike">Nike</option>
                    <option value="Jordan">Jordan</option>
                    <option value="Adidas">Adidas</option>
                    <option value="New Balance">New Balance</option>
                    <option value="Asics">Asics</option>
                    <option value="Puma">Puma</option>
                    <option value="Vans">Vans</option>
                    <option value="Converse">Converse</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Kategori *</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.filter((c) => c !== 'Semua').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Ukuran (Size) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: US 9 / EU 42.5"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kondisi Fisik *</label>
                  <select
                    className="form-select"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  >
                    <option value="Brand New In Box (BNIB)">Brand New In Box (BNIB)</option>
                    <option value="Very Near Deadstock (VNDS)">Very Near Deadstock (VNDS)</option>
                    <option value="Used (Kondisi Terawat)">Used (Kondisi Terawat)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="2500000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stok Unit *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Status Autentikasi Vault */}
              <div className="form-group">
                <label className="form-label">Status Verifikasi Vault *</label>
                <select
                  className="form-select"
                  value={formData.authStatus}
                  onChange={(e) => setFormData({ ...formData, authStatus: e.target.value })}
                >
                  <option value="verified">✅ Terverifikasi &amp; Lolos ACC Vault (Katalog Publik)</option>
                  <option value="pending">⏳ Menunggu ACC Vault</option>
                  <option value="rejected">❌ Ditolak / Tidak Lolos Legit Check</option>
                </select>
              </div>

              {/* Multi-Photo Uploader */}
              <div className="form-group">
                <label className="form-label">Foto &amp; Galeri Detail Sepatu (Hingga 8 Foto)</label>
                <ImageUploader
                  images={formData.images}
                  maxPhotos={8}
                  onChange={(newImgs) => {
                    setFormData({
                      ...formData,
                      images: newImgs,
                      image: newImgs[0] || '',
                    })
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nama Consignor / Penjual</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.consignor}
                  onChange={(e) => setFormData({ ...formData, consignor: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi &amp; Detail Tambahan</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Catatan kondisi, kelengkapan box, nomor batch..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  {editingShoe ? 'Simpan Perubahan' : 'Simpan ke Inventaris'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DELETE CONFIRMATION
          ===================================================================== */}
      {deleteCandidate && (
        <div className="modal-overlay" onClick={() => setDeleteCandidate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--danger)' }}>
                Konfirmasi Hapus Sepatu
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeleteCandidate(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', lineHeight: '1.6' }}>
                Apakah Anda yakin ingin menghapus <strong>&quot;{deleteCandidate.name}&quot;</strong> dari inventaris katalog?
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDeleteCandidate(null)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={confirmDelete}
                >
                  Hapus Sepatu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DETAIL & MULTI-PHOTO INSPECTION MODAL
          ===================================================================== */}
      {selectedDetailShoe && (
        <div className="modal-overlay" onClick={() => setSelectedDetailShoe(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🔍</span>
                <h2 className="modal-title" style={{ fontSize: '18px' }}>
                  Inspeksi Detail &amp; Legit Check
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedDetailShoe(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <img
                  src={
                    (Array.isArray(selectedDetailShoe.images) && selectedDetailShoe.images[0]) ||
                    selectedDetailShoe.image ||
                    '/shoes/dunk-low.svg'
                  }
                  alt={selectedDetailShoe.name}
                  style={{
                    width: '130px',
                    height: '100px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.08))',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', background: '#e0f2fe', color: '#0369a1' }}>
                      {selectedDetailShoe.category}
                    </span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', background: '#ecfdf5', color: '#065f46' }}>
                      {selectedDetailShoe.condition}
                    </span>
                    {selectedDetailShoe.authStatus === 'pending' ? (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '800', background: '#fef3c7', color: '#92400e' }}>
                        ⏳ Menunggu ACC
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '800', background: '#ecfdf5', color: '#065f46' }}>
                        ✓ Lolos ACC Vault
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                    {selectedDetailShoe.name}
                  </h3>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#006b52' }}>
                    {formatRupiah(selectedDetailShoe.price)}
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '18px' }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '8px' }}>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Brand</small>
                  <strong>{selectedDetailShoe.brand}</strong>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '8px' }}>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Ukuran (Size)</small>
                  <strong>{selectedDetailShoe.size}</strong>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '8px' }}>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Consignor Pengaju</small>
                  <strong>{selectedDetailShoe.consignor || 'Verified Consignor'}</strong>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '8px' }}>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Stok Unit</small>
                  <strong>{selectedDetailShoe.stock} unit</strong>
                </div>
              </div>

              {/* Photos Gallery */}
              {Array.isArray(selectedDetailShoe.images) && selectedDetailShoe.images.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>
                    Foto Detail 8 Sudut Verifikasi ({selectedDetailShoe.images.length} Foto):
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                    {selectedDetailShoe.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Sudut ${idx + 1}`}
                        style={{
                          width: '80px',
                          height: '65px',
                          objectFit: 'contain',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '4px',
                          background: '#fff',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '6px', color: '#0f172a' }}>Deskripsi Produk:</h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', background: '#f8fafc', padding: '12px', borderRadius: '8px', margin: 0 }}>
                  {selectedDetailShoe.description || 'Tidak ada deskripsi tambahan untuk produk ini.'}
                </p>
              </div>

              {/* Quick ACC inside Inspection modal */}
              {selectedDetailShoe.authStatus === 'pending' && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#92400e' }}>Status: Menunggu ACC Vault</strong>
                    <small style={{ color: '#78350f' }}>Loloskan legit check untuk menayangkan ke katalog publik</small>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const s = selectedDetailShoe
                      setSelectedDetailShoe(null)
                      handleAccVault(s)
                    }}
                    style={{
                      background: '#047857',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    ✓ ACC Sekarang
                  </button>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedDetailShoe(null)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const s = selectedDetailShoe
                  setSelectedDetailShoe(null)
                  handleOpenEditModal(s)
                }}
              >
                ✏️ Edit Data Sepatu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageShoes
