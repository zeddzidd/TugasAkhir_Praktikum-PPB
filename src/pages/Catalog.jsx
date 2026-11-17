import { useState, useMemo, useEffect } from 'react'
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
}) {
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [sortBy, setSortBy] = useState('default')
  const [activeShoe, setActiveShoe] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Featured shoes for the hero carousel (6 slides)
  const carouselShoes = useMemo(() => {
    const featured = shoes.filter((s) => s.isFeatured)
    if (featured.length >= 6) return featured.slice(0, 6)
    return shoes.slice(0, 6)
  }, [shoes])

  // Auto-advance carousel every 5s if not hovered
  const [isPaused, setIsPaused] = useState(false)
  useEffect(() => {
    if (isPaused || carouselShoes.length === 0) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselShoes.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isPaused, carouselShoes.length])

  const handlePrevSlide = (e) => {
    e.stopPropagation()
    setCurrentSlide((prev) => (prev === 0 ? carouselShoes.length - 1 : prev - 1))
  }

  const handleNextSlide = (e) => {
    e.stopPropagation()
    setCurrentSlide((prev) => (prev + 1) % carouselShoes.length)
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
        } else if (
          selectedSubNav &&
          selectedSubNav !== 'all' &&
          selectedSubNav !== 'redemption' &&
          selectedSubNav !== 'express'
        ) {
          if (shoe.category !== selectedSubNav && selectedSubNav !== 'Electronics' && selectedSubNav !== 'Watches' && selectedSubNav !== 'Trading Cards' && selectedSubNav !== 'K-Brands') {
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

  const currentHeroShoe = carouselShoes[currentSlide] || carouselShoes[0]
  const nextHeroShoe = carouselShoes[(currentSlide + 1) % carouselShoes.length]

  return (
    <div className="catalog-page-container">
      {/* Hero Banner Carousel (Exact match to Kick Avenue UI) */}
      {currentHeroShoe && (
        <section
          className="hero-carousel-wrap"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onClick={() => setActiveShoe(currentHeroShoe)}
          title={`Lihat detail ${currentHeroShoe.name}`}
        >
          <div className="hero-carousel-inner">
            {/* Main Featured Shoe Floating Image */}
            <div className="hero-shoe-center">
              <img
                src={currentHeroShoe.image}
                alt={currentHeroShoe.name}
                className="hero-shoe-image"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = '/shoes/dunk-low.svg'
                }}
              />
            </div>

            {/* Next Shoe Peeking On The Right (Kick Avenue Signature) */}
            {nextHeroShoe && (
              <div
                className="hero-next-peek"
                onClick={handleNextSlide}
                title={`Berikutnya: ${nextHeroShoe.name}`}
              >
                <img
                  src={nextHeroShoe.image}
                  alt={nextHeroShoe.name}
                  className="hero-next-image"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = '/shoes/dunk-low.svg'
                  }}
                />
              </div>
            )}

            {/* Bottom-Left Information: Product Name & Colorway */}
            <div className="hero-shoe-info">
              <h2 className="hero-shoe-title">{currentHeroShoe.name.toUpperCase()}</h2>
              <p className="hero-shoe-subtitle">
                {currentHeroShoe.colorway || currentHeroShoe.brand.toUpperCase()}
              </p>
            </div>

            {/* Bottom-Right Controls: Slide Counter (e.g., 2/6) & Navigation */}
            <div className="hero-counter-badge" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="hero-arrow-btn"
                onClick={handlePrevSlide}
                title="Sebelumnya"
              >
                &#8249;
              </button>
              <span className="hero-counter-text">
                {currentSlide + 1}/{carouselShoes.length}
              </span>
              <button
                type="button"
                className="hero-arrow-btn"
                onClick={handleNextSlide}
                title="Berikutnya"
              >
                &#8250;
              </button>
            </div>
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

      {/* Detailed Inspection Modal */}
      {activeShoe && (
        <ShoeModal shoe={activeShoe} onClose={() => setActiveShoe(null)} />
      )}
    </div>
  )
}

export default Catalog
