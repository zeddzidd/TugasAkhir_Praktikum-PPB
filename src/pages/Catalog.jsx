import { useState, useMemo, useEffect, useRef } from 'react'
import ShoeCard from '../components/ShoeCard.jsx'
import ShoeModal from '../components/ShoeModal.jsx'
import ImageUploader from '../components/ImageUploader.jsx'
import { CATEGORIES, formatRupiah } from '../data/shoes.js'
import { isAdminUser } from '../lib/supabase.js'

const POPULAR_BRANDS = ['Nike', 'Jordan', 'Adidas', 'New Balance', 'Asics', 'Puma', 'Vans', 'Converse']
const CONDITIONS = [
  { id: 'Brand New In Box (BNIB)', label: 'BNIB', desc: 'Baru dalam boks' },
  { id: 'Very Near Deadstock (VNDS)', label: 'VNDS', desc: 'Seperti baru 98%+' },
  { id: 'Used (Kondisi Terawat)', label: 'Used', desc: 'Terawat' },
]

const INITIAL_ADD_FORM = {
  name: '',
  colorway: '',
  brand: 'Nike',
  category: 'Sneakers',
  size: 'US 9 / EU 42.5',
  condition: 'Brand New In Box (BNIB)',
  price: '',
  stock: 1,
  isExpress: true,
  isFeatured: true,
  images: [],
  consignor: '',
  description: '',
}

function Catalog({
  shoes,
  searchQuery,
  onSearchChange,
  selectedSubNav,
  onSelectSubNav,
  onNavigateManage,
  onNavigateConsign,
  currentUser,
  onOpenAuth,
  onAddShoe,
}) {
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [sortBy, setSortBy] = useState('default')
  const [activeShoe, setActiveShoe] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // State untuk Modal Tambah Sepatu Baru langsung di Katalog
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addFormData, setAddFormData] = useState(INITIAL_ADD_FORM)
  const [addErrorMsg, setAddErrorMsg] = useState('')
  const [addSuccessToast, setAddSuccessToast] = useState('')

  // Batasi hero banner carousel menjadi 5 slide teratas dari katalog
  const carouselShoes = useMemo(() => shoes.slice(0, 5), [shoes])
  const safeSlide =
    carouselShoes.length > 0
      ? ((currentSlide % carouselShoes.length) + carouselShoes.length) %
        carouselShoes.length
      : 0

  // Auto-advance carousel every 6s
  useEffect(() => {
    if (isPaused || carouselShoes.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselShoes.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isPaused, carouselShoes.length])

  const handlePrevSlide = (e) => {
    if (e) e.stopPropagation()
    setCurrentSlide((prev) => (prev === 0 ? carouselShoes.length - 1 : prev - 1))
  }

  const handleNextSlide = (e) => {
    if (e) e.stopPropagation()
    setCurrentSlide((prev) => (prev + 1) % carouselShoes.length)
  }

  // Touch and Mouse Swipe / Drag Handlers
  const touchStartXRef = useRef(null)
  const touchEndXRef = useRef(null)
  const isDraggingRef = useRef(false)

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diff = touchStartXRef.current - touchEndXRef.current
      if (diff > 45) {
        // Swiped Left -> Next Slide
        handleNextSlide()
      } else if (diff < -45) {
        // Swiped Right -> Previous Slide
        handlePrevSlide()
      }
    }
    touchStartXRef.current = null
    touchEndXRef.current = null
  }

  const handleMouseDown = (e) => {
    touchStartXRef.current = e.clientX
    isDraggingRef.current = true
  }

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return
    touchEndXRef.current = e.clientX
  }

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      handleTouchEnd()
    }
    isDraggingRef.current = false
  }

  // Filter shoes based on search, category, and sub-nav (e.g. Express Shipping)
  const filteredShoes = useMemo(() => {
    return shoes
      .filter((shoe) => {
        // Sepatu yang masih 'pending' hanya tampil jika sudah lolos ACC ('verified') atau default, kecuali jika login sebagai Admin
        const isVerified = shoe.authStatus === 'verified' || !shoe.authStatus
        if (!isAdminUser(currentUser) && !isVerified) return false

        // Search query filter
        const query = searchQuery.trim().toLowerCase()
        const matchesSearch =
          !query ||
          shoe.name.toLowerCase().includes(query) ||
          shoe.brand.toLowerCase().includes(query) ||
          (shoe.colorway && shoe.colorway.toLowerCase().includes(query)) ||
          shoe.condition.toLowerCase().includes(query)

        // Sub-nav filters
        if (selectedSubNav === 'express') {
          if (!shoe.isExpress) return false
        } else if (selectedSubNav === 'standard') {
          // All items support standard shipping with thorough authentication inspection
          if (shoe.isExpress && selectedSubNav === 'standard_only') return false
        } else if (
          selectedSubNav &&
          selectedSubNav !== 'all' &&
          selectedSubNav !== 'redemption' &&
          selectedSubNav !== 'express' &&
          selectedSubNav !== 'standard'
        ) {
          if (
            shoe.category !== selectedSubNav &&
            selectedSubNav !== 'Electronics' &&
            selectedSubNav !== 'Watches' &&
            selectedSubNav !== 'Trading Cards' &&
            selectedSubNav !== 'K-Brands'
          ) {
            return false
          }
        }

        // Category pill filter
        const matchesCategory =
          selectedCategory === 'Semua' || shoe.category === selectedCategory

        return matchesSearch && matchesCategory
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price
        if (sortBy === 'price-desc') return b.price - a.price
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
        return 0
      })
  }, [shoes, searchQuery, selectedCategory, selectedSubNav, sortBy])

  const currentHeroShoe = carouselShoes[safeSlide] || carouselShoes[0]
  const nextHeroShoe = carouselShoes[(safeSlide + 1) % carouselShoes.length]

  const handleOpenAddModal = () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth('login')
      return
    }
    // Jika bukan Admin, arahkan pengguna ke menu Titip Jual (Sell)
    if (!isAdminUser(currentUser)) {
      if (onNavigateConsign) onNavigateConsign()
      return
    }
    setAddFormData({
      ...INITIAL_ADD_FORM,
      consignor: currentUser.fullName ? currentUser.fullName : 'ZedConsign Verified Seller',
    })
    setAddErrorMsg('')
    setIsAddModalOpen(true)
  }

  const handleAddSubmit = (e) => {
    e.preventDefault()
    setAddErrorMsg('')

    if (!addFormData.name.trim()) {
      setAddErrorMsg('Mohon isi nama sepatu / model terlebih dahulu!')
      return
    }

    const priceNum = Number(addFormData.price)
    if (isNaN(priceNum) || priceNum <= 0) {
      setAddErrorMsg('Harga jual harus berupa angka valid di atas Rp 0!')
      return
    }

    if (!addFormData.images || addFormData.images.length === 0) {
      setAddErrorMsg('Mohon unggah minimal 1 foto sepatu atau klik tombol "⚡ Isi Cepat 8 Foto"!')
      return
    }

    const primaryImage = addFormData.images[0]
    const finalImages = addFormData.images

    const newShoe = {
      id: `shoe-${Date.now()}`,
      name: addFormData.name.trim(),
      colorway: addFormData.colorway.trim() || addFormData.name.trim().toUpperCase(),
      brand: addFormData.brand,
      category: addFormData.category,
      size: addFormData.size.trim(),
      condition: addFormData.condition,
      price: priceNum,
      stock: Number(addFormData.stock) || 1,
      isExpress: Boolean(addFormData.isExpress),
      isFeatured: Boolean(addFormData.isFeatured),
      image: primaryImage,
      images: finalImages,
      consignor: addFormData.consignor.trim() || (currentUser?.fullName || 'ZedConsign Verified Seller'),
      description: addFormData.description.trim() || 'Sepatu autentik terverifikasi dari kurator ZedConsign Vault.',
      authStatus: 'verified', // Ditambah oleh admin = langsung terverifikasi Vault
      verifiedAt: new Date().toISOString(),
      verifiedBy: currentUser?.fullName || 'Admin Shiddiq Yazid',
    }

    if (onAddShoe) {
      onAddShoe(newShoe)
    }

    setIsAddModalOpen(false)
    setAddSuccessToast(`✓ Sepatu "${newShoe.name}" berhasil ditambahkan dan langsung tayang di katalog!`)
    setTimeout(() => setAddSuccessToast(''), 4500)
  }

  return (
    <div className="catalog-page-container">
      {/* Hero Banner Carousel (Exact match to Kick Avenue UI with Sliding Transition & Nav Chevrons) */}
      {carouselShoes.length > 0 && (
        <section
          className="hero-carousel-wrap"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false)
            isDraggingRef.current = false
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          title="Geser atau klik panah untuk melihat koleksi lainnya"
        >
          {/* Left Navigation Chevron Button (Thin Chevron matching screenshot) */}
          <button
            type="button"
            className="carousel-chevron-btn chevron-left"
            onClick={handlePrevSlide}
            aria-label="Slide sebelumnya"
            title="Sebelumnya"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Right Navigation Chevron Button (Thin Chevron matching screenshot) */}
          <button
            type="button"
            className="carousel-chevron-btn chevron-right"
            onClick={handleNextSlide}
            aria-label="Slide berikutnya"
            title="Berikutnya"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Sliding Track for smooth slide animation */}
          <div
            className="carousel-sliding-track"
            style={{
              transform: `translateX(-${safeSlide * 100}%)`,
            }}
          >
            {carouselShoes.map((shoe) => (
              <div
                key={shoe.id}
                className="carousel-slide-item"
                onClick={() => setActiveShoe(shoe)}
              >
                {/* Floating Centered Shoe */}
                <div className="hero-shoe-center">
                  <img
                    src={shoe.image}
                    alt={shoe.name}
                    className="hero-shoe-image"
                    draggable={false}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = '/shoes/dunk-low.svg'
                    }}
                  />
                </div>

                {/* Bottom-Left Information: Product Name & Colorway */}
                <div className="hero-shoe-info">
                  <h2 className="hero-shoe-title">
                    {shoe.colorway === 'SHOX Z CALISTRA'
                      ? shoe.brand.toUpperCase()
                      : shoe.name.toUpperCase()}
                  </h2>
                  <p className="hero-shoe-subtitle">
                    {shoe.colorway || shoe.brand.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom-Right Counter Badge: e.g. "1/8" matching catalog length */}
          <div className="hero-counter-badge-simple" onClick={(e) => e.stopPropagation()}>
            <span className="hero-counter-text">
              {safeSlide + 1}/{carouselShoes.length}
            </span>
          </div>
        </section>
      )}

      {/* Section Header: Sneakers Top Selling */}
      <section className="section-header-row">
        <div className="section-title-wrap">
          <h2 className="section-title">Sneakers Top Selling</h2>
          <span className="section-subtext">
            {filteredShoes.length} produk autentik terkurasi
          </span>
        </div>

        <div className="section-actions-wrap">
          <div className="section-action-buttons">
            <button
              type="button"
              className="btn-add-shoe-catalog"
              onClick={handleOpenAddModal}
              title={isAdminUser(currentUser) ? "Tambah sepatu baru langsung ke katalog (Khusus Admin)" : "Ajukan Titip Jual Sepatu Koleksi Anda"}
            >
              <span className="btn-icon">✨</span>
              <span>{isAdminUser(currentUser) ? '+ Tambah Sepatu' : 'Titip Jual Sepatu'}</span>
            </button>

            {isAdminUser(currentUser) && (
              <button
                type="button"
                className="btn-manage-quick"
                onClick={onNavigateManage}
                title="Portal Admin: Kelola & Vault Authentifikasi"
              >
                <span className="btn-icon">🛡️</span>
                <span>Admin Vault</span>
              </button>
            )}
          </div>

          <div className="section-sort-wrap">
            <select
              className="filter-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Urutkan produk katalog"
            >
              <option value="default">Urutkan: Rekomendasi</option>
              <option value="price-asc">Harga: Terendah ke Tertinggi</option>
              <option value="price-desc">Harga: Tertinggi ke Terendah</option>
              <option value="name-asc">Nama: A - Z</option>
              <option value="name-desc">Nama: Z - A</option>
            </select>
          </div>
        </div>
      </section>

      {/* Category Pills Filter */}
      <div className="catalog-category-strip">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`category-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}

        {selectedSubNav === 'express' && (
          <button
            type="button"
            className="category-pill-btn active express-active"
            onClick={() => onSelectSubNav('all')}
          >
            ⚡ Express Shipping Only &times;
          </button>
        )}
        {selectedSubNav === 'standard' && (
          <button
            type="button"
            className="category-pill-btn active"
            style={{ background: '#3b82f6', color: '#ffffff' }}
            onClick={() => onSelectSubNav('all')}
          >
            📦 Standard Shipping &times;
          </button>
        )}
      </div>

      {/* Active Search / Filter Indicator */}
      {searchQuery && (
        <div className="search-status-bar">
          <span>
            Menampilkan hasil untuk <strong>&quot;{searchQuery}&quot;</strong>
          </span>
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => onSearchChange('')}
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* Product Grid */}
      {filteredShoes.length > 0 ? (
        <div className="products-grid">
          {filteredShoes.map((shoe) => (
            <ShoeCard
              key={shoe.id}
              shoe={shoe}
              onSelect={(item) => setActiveShoe(item)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-catalog-state">
          <div className="empty-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3>Produk Tidak Ditemukan</h3>
          <p>
            Tidak ada produk yang sesuai dengan filter atau kata kunci pencarian Anda.
          </p>
          <button
            type="button"
            className="btn-reset-filters"
            onClick={() => {
              onSearchChange('')
              setSelectedCategory('Semua')
              onSelectSubNav('all')
            }}
          >
            Kembalikan Semua Filter
          </button>
        </div>
      )}

      {/* Detailed Inspection Modal with Kick Avenue Size Selector */}
      {activeShoe && (
        <ShoeModal
          shoe={activeShoe}
          onClose={() => setActiveShoe(null)}
          onNavigateConsign={onNavigateConsign}
          currentUser={currentUser}
          onOpenAuth={onOpenAuth}
        />
      )}

      {/* Toast Notification */}
      {addSuccessToast && (
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span>
          <span>{addSuccessToast}</span>
        </div>
      )}

      {/* Modal Tambah Sepatu Baru Super Elegan & Lengkap */}
      {isAddModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsAddModalOpen(false)}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9990,
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <div
            className="modal-window"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '740px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#006b52',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginBottom: '2px',
                  }}
                >
                  ✨ ZEDCONSIGN CURATED CATALOG
                </span>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                  Tambah Sepatu Baru ke Katalog
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: '1',
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleAddSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {addErrorMsg && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>⚠️</span>
                  <span>{addErrorMsg}</span>
                </div>
              )}

              {/* CARD 1: Informasi Utama */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '18px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '18px' }}>👟</span>
                  <strong style={{ fontSize: '14px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    1. Identitas &amp; Spesifikasi Sepatu
                  </strong>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Nama Sepatu / Model *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Air Jordan 1 Retro High OG Chicago"
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    required
                    style={{ background: '#fff', fontSize: '14px' }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Colorway Resmi
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: VARSITY RED / BLACK / WHITE"
                    value={addFormData.colorway}
                    onChange={(e) => setAddFormData({ ...addFormData, colorway: e.target.value })}
                    style={{ background: '#fff', fontSize: '14px' }}
                  />
                </div>

                {/* Brand Selector Pills */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                    Pilih Brand / Produsen *
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {POPULAR_BRANDS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setAddFormData({ ...addFormData, brand: b })}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: addFormData.brand === b ? '2px solid #006b52' : '1px solid #cbd5e1',
                          background: addFormData.brand === b ? '#006b52' : '#ffffff',
                          color: addFormData.brand === b ? '#ffffff' : '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Kategori & Ukuran */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Kategori *
                    </label>
                    <select
                      className="form-select"
                      value={addFormData.category}
                      onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
                      style={{ background: '#fff' }}
                    >
                      {CATEGORIES.filter((c) => c !== 'Semua').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Ukuran / Size (US / EU) *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="US 9 / EU 42.5"
                      value={addFormData.size}
                      onChange={(e) => setAddFormData({ ...addFormData, size: e.target.value })}
                      required
                      style={{ background: '#fff' }}
                    />
                  </div>
                </div>

                {/* Kondisi Pills */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                    Kondisi Fisik Unit *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                    {CONDITIONS.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setAddFormData({ ...addFormData, condition: c.id })}
                        style={{
                          border: addFormData.condition === c.id ? '2px solid #006b52' : '1px solid #cbd5e1',
                          background: addFormData.condition === c.id ? '#ecfdf5' : '#ffffff',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <strong style={{ display: 'block', fontSize: '13px', color: addFormData.condition === c.id ? '#065f46' : '#1e293b' }}>
                          {c.label}
                        </strong>
                        <small style={{ fontSize: '11px', color: '#64748b' }}>{c.desc}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CARD 2: Harga, Stok & Layanan Vault */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '18px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '18px' }}>💰</span>
                  <strong style={{ fontSize: '14px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    2. Harga, Stok &amp; Opsi Pengiriman
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Harga Jual (Rupiah) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      placeholder="Contoh: 2850000"
                      value={addFormData.price}
                      onChange={(e) => setAddFormData({ ...addFormData, price: e.target.value })}
                      required
                      style={{ background: '#fff', fontSize: '15px', fontWeight: '700' }}
                    />
                    {addFormData.price && Number(addFormData.price) > 0 && (
                      <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', fontWeight: '700', color: '#006b52' }}>
                        Tampilan Harga: {formatRupiah(Number(addFormData.price))}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Stok Unit *
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={addFormData.stock}
                      onChange={(e) => setAddFormData({ ...addFormData, stock: e.target.value })}
                      required
                      style={{ background: '#fff' }}
                    />
                  </div>
                </div>

                {/* 2 Toggle Option Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      borderRadius: '10px',
                      background: addFormData.isExpress ? '#fef3c7' : '#ffffff',
                      border: addFormData.isExpress ? '1px solid #fde68a' : '1px solid #cbd5e1',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={addFormData.isExpress}
                      onChange={(e) => setAddFormData({ ...addFormData, isExpress: e.target.checked })}
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '13px', color: '#92400e' }}>⚡ Express Ready</strong>
                      <small style={{ fontSize: '11px', color: '#78350f' }}>Siap dikirim 1-2 hari dari Vault</small>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      borderRadius: '10px',
                      background: addFormData.isFeatured ? '#f0fdf4' : '#ffffff',
                      border: addFormData.isFeatured ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={addFormData.isFeatured}
                      onChange={(e) => setAddFormData({ ...addFormData, isFeatured: e.target.checked })}
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '13px', color: '#166534' }}>⭐ Featured Item</strong>
                      <small style={{ fontSize: '11px', color: '#15803d' }}>Sorot di rekomendasi beranda</small>
                    </div>
                  </label>
                </div>
              </div>

              {/* CARD 3: Foto & Galeri Sepatu (Hingga 8 Foto) */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '18px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '18px' }}>📸</span>
                  <strong style={{ fontSize: '14px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    3. Foto &amp; Galeri Detail Sepatu (Maksimal 8 Foto)
                  </strong>
                </div>

                <ImageUploader
                  images={addFormData.images}
                  maxPhotos={8}
                  onChange={(newImgs) =>
                    setAddFormData({
                      ...addFormData,
                      images: newImgs,
                    })
                  }
                />
              </div>

              {/* CARD 4: Consignor & Deskripsi */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '18px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '18px' }}>📝</span>
                  <strong style={{ fontSize: '14px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    4. Consignor &amp; Deskripsi Produk
                  </strong>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Nama Consignor / Penjual
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={addFormData.consignor}
                    onChange={(e) => setAddFormData({ ...addFormData, consignor: e.target.value })}
                    style={{ background: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Deskripsi &amp; Detail Produk
                  </label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Tuliskan catatan kondisi, kelengkapan boks, extra laces, atau cerita siluet ini..."
                    value={addFormData.description}
                    onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                    style={{ background: '#fff' }}
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '10px 20px', fontSize: '14px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #0f172a 0%, #006b52 100%)',
                    border: '1px solid rgba(0,223,162,0.4)',
                    boxShadow: '0 4px 14px rgba(0,107,82,0.3)',
                  }}
                >
                  🚀 Simpan &amp; Tayangkan ke Katalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Catalog
