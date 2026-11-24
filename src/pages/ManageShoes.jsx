import { useState } from 'react'
import { formatRupiah, CATEGORIES } from '../data/shoes.js'
import ImageUploader from '../components/ImageUploader.jsx'

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
}) {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShoe, setEditingShoe] = useState(null)
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [errorMsg, setErrorMsg] = useState('')
  const [syncFeedback, setSyncFeedback] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedDetailShoe, setSelectedDetailShoe] = useState(null)

  // Calculate statistics
  const totalItems = shoes.length
  const totalStock = shoes.reduce((acc, s) => acc + (Number(s.stock) || 1), 0)
  const totalInventoryValue = shoes.reduce((acc, s) => acc + (Number(s.price) || 0) * (Number(s.stock) || 1), 0)

  // Filtered shoes
  const filteredShoes = shoes.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.brand.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenAddModal = () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth('login')
      return
    }
    setEditingShoe(null)
    setFormData(INITIAL_FORM)
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (shoe) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth('login')
      return
    }
    setEditingShoe(shoe)
    const shoeImgs = Array.isArray(shoe.images) && shoe.images.length > 0
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

    const finalImages = Array.isArray(formData.images) && formData.images.length > 0
      ? formData.images
      : [formData.image || '/shoes/dunk-low.svg']
    const primaryImage = finalImages[0] || '/shoes/dunk-low.svg'

    if (editingShoe) {
      // Update
      onUpdateShoe({
        ...editingShoe,
        ...formData,
        image: primaryImage,
        images: finalImages,
        price: priceNum,
        stock: stockNum,
      })
    } else {
      // Create
      const newShoe = {
        id: `shoe-${Date.now()}`,
        ...formData,
        image: primaryImage,
        images: finalImages,
        price: priceNum,
        stock: stockNum,
      }
      onAddShoe(newShoe)
    }

    setIsModalOpen(false)
  }

  const confirmDelete = () => {
    if (deleteCandidate) {
      onDeleteShoe(deleteCandidate.id)
      setDeleteCandidate(null)
    }
  }

  const handleTriggerSync = async () => {
    if (!onSyncSupabase) return
    setIsSyncing(true)
    setSyncFeedback(null)
    try {
      const res = await onSyncSupabase()
      if (res && res.success) {
        setSyncFeedback({
          type: 'success',
          text: `Berhasil menyinkronkan ${res.count} sepatu ke tabel "shoes" di Supabase Cloud!`,
        })
      } else {
        setSyncFeedback({
          type: 'error',
          text: `Gagal sinkron: ${res?.message || 'Pastikan script schema.sql sudah dijalankan di Supabase SQL Editor.'}`,
        })
      }
    } catch (e) {
      setSyncFeedback({
        type: 'error',
        text: `Error sinkron: ${e.message}`,
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div>
      {/* Guest Banner if not logged in */}
      {!currentUser && (
        <div className="manage-guest-banner">
          <div className="guest-banner-icon">🔒</div>
          <div className="guest-banner-text">
            <strong>Mode Pratinjau Inventaris (Tamu)</strong>
            <p>Untuk menambah, mengedit, atau menghapus sepatu dari katalog inventaris, Anda harus masuk (login) terlebih dahulu.</p>
          </div>
          <button
            type="button"
            className="btn-guest-login"
            onClick={() => onOpenAuth && onOpenAuth('login')}
          >
            Masuk Akun
          </button>
        </div>
      )}

      {/* CRUD Page Header */}
      <div className="crud-page-header">
        <div className="crud-title-group">
          <h1>Kelola Inventaris &amp; Katalog Sepatu</h1>
          <p>
            Manajemen inventaris dan katalog sepatu secara real-time dengan sinkronisasi lokal dan cloud.
          </p>
        </div>

        <div className="crud-btn-group">
          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenAddModal}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah Sepatu Baru
          </button>
        </div>
      </div>

      {/* Sync Feedback Message */}
      {syncFeedback && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            backgroundColor: syncFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: syncFeedback.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${syncFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{syncFeedback.text}</span>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'inherit' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Model Terdaftar
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>
            {totalItems} Model
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Total Pasang (Stok)
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
            {totalStock} Pasang
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Estimasi Nilai Barang
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent)' }}>
            {formatRupiah(totalInventoryValue)}
          </div>
        </div>
      </div>

      {/* Search Input for Table */}
      <div style={{ marginBottom: '16px', maxWidth: '400px' }}>
        <input
          type="text"
          className="search-input"
          placeholder="Filter data sepatu di tabel..."
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
              <th>Harga</th>
              <th>Stok</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredShoes.length > 0 ? (
              filteredShoes.map((shoe) => (
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
                        <strong style={{ display: 'block', color: 'var(--text-main)' }}>
                          {shoe.name}
                        </strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                          {shoe.brand} &bull; {shoe.consignor || 'ZedConsign'}
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
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {shoe.condition}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--accent)' }}>
                      {formatRupiah(shoe.price)}
                    </strong>
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
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => setSelectedDetailShoe(shoe)}
                        title="Lihat detail lengkap inventaris sepatu"
                      >
                        👁️ Detail
                      </button>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleOpenEditModal(shoe)}
                        title="Edit data sepatu ini"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => {
                          if (!currentUser) {
                            if (onOpenAuth) onOpenAuth('login')
                            return
                          }
                          setDeleteCandidate(shoe)
                        }}
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
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                  Tidak ada data sepatu yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingShoe ? 'Edit Data Sepatu' : 'Tambah Sepatu Baru ke Katalog'}
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

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Brand *</label>
                  <select
                    className="form-select"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  >
                    <option value="Jordan">Jordan</option>
                    <option value="Nike">Nike</option>
                    <option value="Adidas">Adidas</option>
                    <option value="New Balance">New Balance</option>
                    <option value="Puma">Puma</option>
                    <option value="Asics">Asics</option>
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

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ukuran / Size (US / EU) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: US 9.5 / EU 43"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kondisi Sepatu *</label>
                  <select
                    className="form-select"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  >
                    <option value="Brand New In Box (BNIB)">Brand New In Box (BNIB)</option>
                    <option value="Like New (VNDS 9.8/10)">Like New (VNDS 9.8/10)</option>
                    <option value="Pre-owned (Used 9.5/10)">Pre-owned (Used 9.5/10)</option>
                    <option value="Pre-owned (Used 9.0/10)">Pre-owned (Used 9.0/10)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Harga Consign (Rp) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Contoh: 3500000"
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

              <div className="form-group">
                <ImageUploader
                  images={formData.images || []}
                  maxPhotos={8}
                  onChange={(newImgs) =>
                    setFormData({
                      ...formData,
                      images: newImgs,
                      image: newImgs[0] || '',
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nama Consignor / Penjual</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Zed Store / Shiddiq Consign"
                  value={formData.consignor}
                  onChange={(e) => setFormData({ ...formData, consignor: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi &amp; Detail Sepatu</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Ceritakan detail kelengkapan box, nomor seri, riwayat pemakaian, atau sertifikasi keaslian..."
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
                  {editingShoe ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="modal-overlay" onClick={() => setDeleteCandidate(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
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
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                Apakah Anda yakin ingin menghapus data sepatu berikut dari katalog?
              </p>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '20px',
                }}
              >
                <strong style={{ display: 'block', fontSize: '15px' }}>
                  {deleteCandidate.name}
                </strong>
                <span style={{ fontSize: '13px', color: 'var(--accent)' }}>
                  {formatRupiah(deleteCandidate.price)} &bull; Size {deleteCandidate.size}
                </span>
              </div>
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
                  Ya, Hapus Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Detail Inventaris Sepatu (Memenuhi Kriteria Halaman Detail) */}
      {selectedDetailShoe && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedDetailShoe(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-window"
            style={{ maxWidth: '680px', padding: '0', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'var(--primary)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Detail Inventaris Vault &bull; {selectedDetailShoe.brand}
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: '800' }}>
                  {selectedDetailShoe.name}
                </h3>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSelectedDetailShoe(null)}
                style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Product Showcase */}
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center',
                  background: '#f9fafb',
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
                    width: '140px',
                    height: '110px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.08))',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        background: '#e0f2fe',
                        color: '#0369a1',
                      }}
                    >
                      {selectedDetailShoe.category}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        background: '#ecfdf5',
                        color: '#065f46',
                      }}
                    >
                      {selectedDetailShoe.condition}
                    </span>
                    {selectedDetailShoe.isExpress && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          background: '#fef3c7',
                          color: '#b45309',
                        }}
                      >
                        ⚡ Express Ready
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent)', marginBottom: '4px' }}>
                    {formatRupiah(selectedDetailShoe.price)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    ID: <code>{selectedDetailShoe.id}</code> &bull; Stok:{' '}
                    <strong>{selectedDetailShoe.stock} unit</strong>
                  </div>
                </div>
              </div>

              {/* Specification Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                  <small style={{ color: 'var(--text-dim)', display: 'block', fontSize: '11px' }}>Brand / Produsen</small>
                  <strong>{selectedDetailShoe.brand}</strong>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                  <small style={{ color: 'var(--text-dim)', display: 'block', fontSize: '11px' }}>Ukuran Tertera</small>
                  <strong>{selectedDetailShoe.size}</strong>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                  <small style={{ color: 'var(--text-dim)', display: 'block', fontSize: '11px' }}>Colorway Resmi</small>
                  <strong>{selectedDetailShoe.colorway || '-'}</strong>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                  <small style={{ color: 'var(--text-dim)', display: 'block', fontSize: '11px' }}>Pemilik Konsinyasi (Consignor)</small>
                  <strong>{selectedDetailShoe.consignor || 'ZedConsign Verified Seller'}</strong>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Deskripsi Produk:</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', background: '#f9fafb', padding: '12px', borderRadius: '8px', margin: 0 }}>
                  {selectedDetailShoe.description || 'Tidak ada deskripsi tambahan untuk produk ini.'}
                </p>
              </div>

              {/* Photo Gallery Previews */}
              {Array.isArray(selectedDetailShoe.images) && selectedDetailShoe.images.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
                    Galeri Foto Sudut Produk ({selectedDetailShoe.images.length} Foto):
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                    {selectedDetailShoe.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Sudut ${idx + 1}`}
                        style={{
                          width: '75px',
                          height: '60px',
                          objectFit: 'contain',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '4px',
                          background: '#fff',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '16px 24px',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
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
                ✏️ Edit Data Sepatu Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageShoes
