import { useState, useMemo, useEffect, useRef } from 'react'
import ShoeCard from '../components/ShoeCard.jsx'
import ShoeModal from '../components/ShoeModal.jsx'
import { CATEGORIES } from '../data/shoes.js'

function Catalog({
  shoes,
  searchQuery,
  onSearchChange,
  selectedSubNav,
  onSelectSubNav,
  onNavigateManage,
  onNavigateConsign,
}) {
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [sortBy, setSortBy] = useState('default')
  const [activeShoe, setActiveShoe] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

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
          <select
            className="filter-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Urutkan: Rekomendasi</option>
            <option value="price-asc">Harga: Terendah ke Tertinggi</option>
            <option value="price-desc">Harga: Tertinggi ke Terendah</option>
            <option value="name-asc">Nama: A - Z</option>
            <option value="name-desc">Nama: Z - A</option>
          </select>

          <button
            type="button"
            className="btn-manage-quick"
            onClick={onNavigateManage}
            title="Kelola & Tambah Sepatu (CRUD Fungsional)"
          >
            + Kelola Sepatu
          </button>
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
        />
      )}
    </div>
  )
}

export default Catalog
