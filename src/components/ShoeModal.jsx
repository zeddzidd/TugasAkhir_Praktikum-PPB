import { useState, useEffect, useMemo } from 'react'
import { formatRupiah } from '../data/shoes.js'

// Standard Sneaker Size Grid Data (Derived from Kick Avenue Catalog)
const BASE_SIZES_DATA = [
  { us: '4', eu: '36', uk: '3.5', cm: '22.0', mult: 0.94, express: true, bestPrice: false },
  { us: '4.5', eu: '36.5', uk: '4', cm: '22.5', mult: 0.96, express: true, bestPrice: false },
  { us: '5', eu: '37.5', uk: '4.5', cm: '23.0', mult: 0.98, express: true, bestPrice: false },
  { us: '5.5', eu: '38', uk: '5', cm: '23.5', mult: 1.0, express: true, bestPrice: false },
  { us: '6', eu: '38.5', uk: '5.5', cm: '24.0', mult: 1.02, express: true, bestPrice: false },
  { us: '6.5', eu: '39', uk: '6', cm: '24.5', mult: 0.92, express: true, bestPrice: false },
  { us: '7', eu: '40', uk: '6.5', cm: '25.0', mult: 0.98, express: true, bestPrice: false },
  { us: '7.5', eu: '40.5', uk: '7', cm: '25.5', mult: 0.99, express: true, bestPrice: false },
  { us: '8', eu: '41', uk: '7.5', cm: '26.0', mult: 1.0, express: true, bestPrice: false },
  { us: '8.5', eu: '42', uk: '8', cm: '26.5', mult: 1.0, express: true, bestPrice: true },
  { us: '9', eu: '42.5', uk: '8.5', cm: '27.0', mult: 1.0, express: true, bestPrice: true },
  { us: '9.5', eu: '43', uk: '9', cm: '27.5', mult: 1.02, express: true, bestPrice: true },
  { us: '10', eu: '44', uk: '9.5', cm: '28.0', mult: 1.03, express: true, bestPrice: true },
  { us: '10.5', eu: '44.5', uk: '10', cm: '28.5', mult: 1.05, express: true, bestPrice: false },
  { us: '11', eu: '45', uk: '10.5', cm: '29.0', mult: 1.08, express: true, bestPrice: false },
  { us: '12', eu: '46', uk: '11.5', cm: '30.0', mult: 1.15, express: true, bestPrice: false },
  { us: '13', eu: '47.5', uk: '12.5', cm: '31.0', mult: 1.25, express: false, bestPrice: false },
]

function ShoeModal({ shoe, onClose, onNavigateConsign }) {
  const [sizeUnit, setSizeUnit] = useState('US') // 'US' | 'EU' | 'UK'
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(10) // Default to US 9
  const [shippingMethod, setShippingMethod] = useState(shoe?.isExpress ? 'express' : 'standard') // 'express' | 'standard'
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(24)
  const [showSizeChart, setShowSizeChart] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [copyToast, setCopyToast] = useState(false)
  const [activeAngleIndex, setActiveAngleIndex] = useState(0)

  const shippingFee = shippingMethod === 'express' ? 45000 : 20000
  const totalPrice = currentPrice + shippingFee

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showCheckoutModal) {
          setShowCheckoutModal(false)
        } else if (showSizeChart) {
          setShowSizeChart(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, showCheckoutModal, showSizeChart])

  // Computed size items for this shoe
  const sizeItems = useMemo(() => {
    const basePrice = shoe ? shoe.price : 2000000
    return BASE_SIZES_DATA.map((item) => {
      const price = Math.round((basePrice * item.mult) / 1000) * 1000
      const strikePrice = Math.round((basePrice * item.mult * 1.24) / 1000) * 1000
      return {
        ...item,
        price,
        strikePrice,
      }
    })
  }, [shoe])

  if (!shoe) return null

  const selectedSize = sizeItems[selectedSizeIndex] || sizeItems[10]
  const currentPrice = selectedSize ? selectedSize.price : shoe.price

  // Toggle Bookmark
  const handleToggleBookmark = () => {
    if (isBookmarked) {
      setIsBookmarked(false)
      setBookmarkCount((prev) => Math.max(0, prev - 1))
    } else {
      setIsBookmarked(true)
      setBookmarkCount((prev) => prev + 1)
    }
  }

  // Copy product share link
  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href)
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 2400)
    } catch {
      alert('Tautan produk telah disalin!')
    }
  }

  // Label for current size unit
  const getSizeLabel = (item) => {
    if (sizeUnit === 'EU') return `EU ${item.eu}`
    if (sizeUnit === 'UK') return `UK ${item.uk}`
    return `US ${item.us}`
  }

  // Angle transforms for image preview rotation
  const angleTransforms = [
    'none',
    'scaleX(-1)',
    'rotate(-3deg) scale(1.03)',
  ]

  const handleNextAngle = () => {
    setActiveAngleIndex((prev) => (prev + 1) % angleTransforms.length)
  }

  // Generate SKU
  const shoeSku = `ZED-${shoe.id.replace('shoe-', '').toUpperCase()}-80185`

  return (
    <div className="ka-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ka-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Sticky Modal Top Bar with Breadcrumbs & Close Button */}
        <div className="ka-modal-top-bar">
          <div className="ka-breadcrumbs">
            <span className="ka-breadcrumb-link">Luxury</span>
            <span className="ka-breadcrumb-sep">/</span>
            <span className="ka-breadcrumb-link">{shoe.brand}</span>
            <span className="ka-breadcrumb-sep">/</span>
            <span className="ka-breadcrumb-current">{shoe.name}</span>
          </div>

          <button
            type="button"
            className="ka-close-btn"
            onClick={onClose}
            aria-label="Tutup"
            title="Tutup (Esc)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Copy Share Toast */}
        {copyToast && (
          <div className="ka-copy-toast">
            <span>Tautan produk berhasil disalin ke clipboard!</span>
          </div>
        )}

        {/* 2-Column Product Detail Layout (Exact Match to Kick Avenue UI) */}
        <div className="ka-detail-layout">
          {/* LEFT COLUMN: Large Sneaker Showcase with Gallery Chevron */}
          <div className="ka-col-gallery">
            <div className="ka-image-showcase-box">
              <img
                src={shoe.image || '/shoes/dunk-low.svg'}
                alt={shoe.name}
                className="ka-main-shoe-img"
                style={{
                  transform: angleTransforms[activeAngleIndex],
                  transition: 'transform 0.3s ease',
                }}
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = '/shoes/dunk-low.svg'
                }}
              />

              {/* Gallery Angle Next Chevron */}
              <button
                type="button"
                className="ka-gallery-next-chevron"
                onClick={handleNextAngle}
                title="Lihat sudut berikutnya"
                aria-label="Ganti sudut sepatu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* 360 / Angle Indicators */}
              <div className="ka-angle-dots">
                {angleTransforms.map((_, idx) => (
                  <span
                    key={idx}
                    className={`ka-angle-dot ${idx === activeAngleIndex ? 'active' : ''}`}
                    onClick={() => setActiveAngleIndex(idx)}
                  />
                ))}
              </div>
            </div>

            {/* Subtle Authentic Guarantee Under-Image Badge */}
            <div className="ka-gallery-badge-row">
              <span className="ka-verified-stamp">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#006b52">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                100% Authentic Verified by ZedConsign Vault
              </span>
              <span className="ka-stock-stamp">Ready Stock: {shoe.stock || 1} Pairs</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Info, Size Selector Grid & Actions */}
          <div className="ka-col-info">
            {/* Price Header with Share Icon */}
            <div className="ka-price-header-row">
              <div className="ka-product-price">
                {formatRupiah(currentPrice)}~
              </div>
              <button
                type="button"
                className="ka-share-btn"
                onClick={handleShare}
                title="Bagikan produk ini"
                aria-label="Bagikan produk"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            </div>

            {/* Product Title */}
            <h1 className="ka-product-title">{shoe.name}</h1>

            {/* Authentic Guaranteed Pill Banner */}
            <div className="ka-banner-authentic" onClick={() => alert('ZedConsign menerapkan 10-Point Physical Verification Check untuk setiap sepatu sebelum dikirim ke pembeli.')}>
              <div className="ka-banner-left">
                <span className="ka-check-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#006b52">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </span>
                <span className="ka-banner-text">
                  <strong>ZEDCONSIGN</strong> is 100% Authentic Guaranteed
                </span>
              </div>
              <span className="ka-banner-arrow">&rsaquo;</span>
            </div>

            {/* Shipping Method Selector (⚡ Express & 📦 Standard) */}
            <div className="ka-shipping-choice-wrap">
              <div className="ka-shipping-choice-header">
                <span className="ka-shipping-choice-title">Metode Pengiriman (Shipping)</span>
                <span className="ka-shipping-active-pill">
                  {shippingMethod === 'express' ? '⚡ Express Aktif' : '📦 Standard Aktif'}
                </span>
              </div>

              <div className="ka-shipping-options-grid">
                {/* ⚡ Express Shipping Option */}
                <div
                  className={`ka-shipping-card ${shippingMethod === 'express' ? 'selected' : ''}`}
                  onClick={() => setShippingMethod('express')}
                  role="button"
                  tabIndex={0}
                  title="Pilih Pengiriman Express (1-2 hari kerja)"
                >
                  <div className="ka-shipping-card-left">
                    <span className="ka-lightning-icon">⚡</span>
                    <div>
                      <div className="ka-shipping-card-title">
                        <strong>Express</strong>
                        <span className="ka-shipping-tag express">1 - 2 Hari</span>
                      </div>
                      <p className="ka-shipping-card-desc">
                        Ships next business day (Siap kirim dari Vault)
                      </p>
                    </div>
                  </div>
                  <div className="ka-shipping-card-right">
                    <span className="ka-shipping-cost">Rp 45.000</span>
                    <span className="ka-shipping-radio-circle">
                      {shippingMethod === 'express' ? '●' : '○'}
                    </span>
                  </div>
                </div>

                {/* 📦 Standard Shipping Option */}
                <div
                  className={`ka-shipping-card ${shippingMethod === 'standard' ? 'selected' : ''}`}
                  onClick={() => setShippingMethod('standard')}
                  role="button"
                  tabIndex={0}
                  title="Pilih Pengiriman Standard (3-5 hari kerja)"
                >
                  <div className="ka-shipping-card-left">
                    <span className="ka-box-icon">📦</span>
                    <div>
                      <div className="ka-shipping-card-title">
                        <strong>Standard</strong>
                        <span className="ka-shipping-tag standard">3 - 5 Hari</span>
                      </div>
                      <p className="ka-shipping-card-desc">
                        Reguler (Inspeksi fisik & autentikasi berstandar)
                      </p>
                    </div>
                  </div>
                  <div className="ka-shipping-card-right">
                    <span className="ka-shipping-cost standard">Rp 20.000</span>
                    <span className="ka-shipping-radio-circle">
                      {shippingMethod === 'standard' ? '●' : '○'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SKU & Color Row */}
            <div className="ka-sku-row">
              <div className="ka-sku-info">
                <span className="ka-sku-code">SKU: {shoeSku}</span>
                <span className="ka-sku-color">Color: {shoe.colorway || 'WHITE / ORIGINAL'}</span>
              </div>
              <span className="ka-sku-arrow">&rsaquo;</span>
            </div>

            {/* ==========================================================================
                SELECT SIZE SECTION (Matching Screenshot 2 with Interactive Grid)
                ========================================================================== */}
            <div className="ka-size-selector-section">
              <div className="ka-size-header-bar">
                <h2 className="ka-size-heading">Select Size</h2>

                <div className="ka-size-right-controls">
                  {/* Size Unit Tabs: US | EU | UK */}
                  <div className="ka-unit-tabs">
                    <button
                      type="button"
                      className={`ka-unit-tab ${sizeUnit === 'US' ? 'active' : ''}`}
                      onClick={() => setSizeUnit('US')}
                    >
                      US
                    </button>
                    <button
                      type="button"
                      className={`ka-unit-tab ${sizeUnit === 'EU' ? 'active' : ''}`}
                      onClick={() => setSizeUnit('EU')}
                    >
                      EU
                    </button>
                    <button
                      type="button"
                      className={`ka-unit-tab ${sizeUnit === 'UK' ? 'active' : ''}`}
                      onClick={() => setSizeUnit('UK')}
                    >
                      UK
                    </button>
                  </div>

                  {/* Size Chart Link */}
                  <button
                    type="button"
                    className="ka-size-chart-link"
                    onClick={() => setShowSizeChart(true)}
                  >
                    Size Chart
                  </button>
                </div>
              </div>

              {/* 5-Column Size Cards Grid (Exact match to Screenshot 2) */}
              <div className="ka-size-cards-grid">
                {sizeItems.map((item, index) => {
                  const isSelected = index === selectedSizeIndex
                  return (
                    <div
                      key={item.us}
                      className={`ka-size-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedSizeIndex(index)}
                      title={`Pilih ${getSizeLabel(item)} - ${formatRupiah(item.price)}`}
                    >
                      {/* Top: Lightning Bolt + Size Number */}
                      <div className="ka-size-card-top">
                        {item.express && <span className="ka-size-lightning">⚡</span>}
                        <span className="ka-size-number">{getSizeLabel(item)}</span>
                      </div>

                      {/* Middle: Price in Green */}
                      <div className="ka-size-card-price">
                        {formatRupiah(item.price)}
                      </div>

                      {/* Bottom: Strikethrough Retail or Best Price Tag */}
                      <div className="ka-size-card-bottom">
                        {item.bestPrice ? (
                          <span className="ka-best-price-tag">Best Price</span>
                        ) : (
                          <span className="ka-strike-price">
                            {formatRupiah(item.strikePrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons: Bookmark | Sell | Buy or Offer */}
            <div className="ka-action-buttons-row">
              {/* Bookmark Button */}
              <button
                type="button"
                className={`ka-bookmark-btn ${isBookmarked ? 'active' : ''}`}
                onClick={handleToggleBookmark}
                title={isBookmarked ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'}
                aria-label="Simpan produk"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isBookmarked ? '#111827' : 'none'} stroke="currentColor" strokeWidth="1.8">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span className="ka-bookmark-count">{bookmarkCount}</span>
              </button>

              {/* Sell Button (Navigates directly to Titip Jual) */}
              <button
                type="button"
                className="ka-sell-btn"
                onClick={() => {
                  onClose()
                  if (onNavigateConsign) {
                    onNavigateConsign()
                  }
                }}
              >
                Sell
              </button>

              {/* Buy or Offer Button in Kick Avenue Deep Emerald Green */}
              <button
                type="button"
                className="ka-buy-offer-btn"
                onClick={() => setShowCheckoutModal(true)}
              >
                Buy or Offer
              </button>
            </div>

            {/* Product Historical Data Accordion */}
            <div className="ka-accordion-box">
              <div
                className="ka-accordion-header"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              >
                <span className="ka-accordion-title">Product Historical Data</span>
                <span className={`ka-accordion-chevron ${isHistoryOpen ? 'open' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>

              {isHistoryOpen && (
                <div className="ka-accordion-content">
                  <div className="ka-history-grid">
                    <div className="ka-history-item">
                      <span className="ka-history-label">Lowest Ask</span>
                      <strong className="ka-history-val">{formatRupiah(currentPrice)}</strong>
                    </div>
                    <div className="ka-history-item">
                      <span className="ka-history-label">Highest Bid</span>
                      <strong className="ka-history-val">{formatRupiah(Math.round(currentPrice * 0.9))}</strong>
                    </div>
                    <div className="ka-history-item">
                      <span className="ka-history-label">Last Sale</span>
                      <strong className="ka-history-val">{formatRupiah(currentPrice)}</strong>
                    </div>
                    <div className="ka-history-item">
                      <span className="ka-history-label">30-Day Sales Volume</span>
                      <strong className="ka-history-val">28 Pasang</strong>
                    </div>
                  </div>

                  <div className="ka-history-consignor">
                    <span>Consignor Terverifikasi: <strong>{shoe.consignor || 'ZedConsign Vault Partner'}</strong></span>
                    <span>Kondisi: <strong>{shoe.condition}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Product Description */}
            <div className="ka-desc-block">
              <h3 className="ka-desc-title">Deskripsi Produk & Jaminan Keaslian</h3>
              <p className="ka-desc-text">{shoe.description}</p>
            </div>
          </div>
        </div>

        {/* ==========================================================================
            SIZE CHART OVERLAY MODAL
            ========================================================================== */}
        {showSizeChart && (
          <div className="ka-sub-modal-backdrop" onClick={() => setShowSizeChart(false)}>
            <div className="ka-sub-modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="ka-sub-modal-header">
                <h3>Panduan Ukuran (Size Chart) - {shoe.brand}</h3>
                <button
                  type="button"
                  className="ka-close-btn"
                  onClick={() => setShowSizeChart(false)}
                >
                  &times;
                </button>
              </div>

              <div className="ka-size-chart-table-wrap">
                <table className="ka-size-table">
                  <thead>
                    <tr>
                      <th>US</th>
                      <th>EU</th>
                      <th>UK</th>
                      <th>CM / Insole</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BASE_SIZES_DATA.map((s) => (
                      <tr
                        key={s.us}
                        className={s.us === selectedSize.us ? 'row-selected' : ''}
                      >
                        <td><strong>US {s.us}</strong></td>
                        <td>EU {s.eu}</td>
                        <td>UK {s.uk}</td>
                        <td>{s.cm} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ka-sub-modal-footer">
                <button
                  type="button"
                  className="ka-btn-confirm"
                  onClick={() => setShowSizeChart(false)}
                >
                  Tutup Panduan Ukuran
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================================================
            BUY OR OFFER CHECKOUT MODAL
            ========================================================================== */}
        {showCheckoutModal && (
          <div className="ka-sub-modal-backdrop" onClick={() => setShowCheckoutModal(false)}>
            <div className="ka-sub-modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="ka-sub-modal-header">
                <h3>Beli / Ajukan Penawaran</h3>
                <button
                  type="button"
                  className="ka-close-btn"
                  onClick={() => setShowCheckoutModal(false)}
                >
                  &times;
                </button>
              </div>

              <div className="ka-checkout-body">
                <div className="ka-checkout-product-row">
                  <img
                    src={shoe.image || '/shoes/dunk-low.svg'}
                    alt={shoe.name}
                    className="ka-checkout-thumb"
                  />
                  <div>
                    <h4 className="ka-checkout-name">{shoe.name}</h4>
                    <p className="ka-checkout-size">
                      Ukuran Terpilih: <strong>{getSizeLabel(selectedSize)}</strong> (EU {selectedSize.eu} / {selectedSize.cm} cm)
                    </p>
                    <p className="ka-checkout-condition">Kondisi: {shoe.condition}</p>
                  </div>
                </div>

                {/* Checkout Shipping Toggle */}
                <div className="ka-checkout-shipping-select">
                  <label className="ka-checkout-shipping-label">Pilih Metode Pengiriman:</label>
                  <div className="ka-checkout-shipping-grid">
                    <button
                      type="button"
                      className={`ka-checkout-ship-btn ${shippingMethod === 'express' ? 'active' : ''}`}
                      onClick={() => setShippingMethod('express')}
                    >
                      <span className="ka-lightning-icon">⚡</span>
                      <span>Express (1-2 Hari)</span>
                      <strong>Rp 45.000</strong>
                    </button>

                    <button
                      type="button"
                      className={`ka-checkout-ship-btn ${shippingMethod === 'standard' ? 'active' : ''}`}
                      onClick={() => setShippingMethod('standard')}
                    >
                      <span className="ka-box-icon">📦</span>
                      <span>Standard (3-5 Hari)</span>
                      <strong>Rp 20.000</strong>
                    </button>
                  </div>
                </div>

                <div className="ka-checkout-price-card">
                  <div className="ka-summary-line">
                    <span>Harga Produk ({getSizeLabel(selectedSize)})</span>
                    <strong>{formatRupiah(currentPrice)}</strong>
                  </div>
                  <div className="ka-summary-line">
                    <span>
                      Ongkos Kirim ({shippingMethod === 'express' ? '⚡ Express 1-2 Hari' : '📦 Standard 3-5 Hari'})
                    </span>
                    <strong>{formatRupiah(shippingFee)}</strong>
                  </div>
                  <div className="ka-summary-line">
                    <span>Biaya Autentikasi & Legit Check</span>
                    <strong style={{ color: '#006b52' }}>GRATIS</strong>
                  </div>
                  <div className="ka-summary-line">
                    <span>Perlindungan Pembeli (Buyer Protection)</span>
                    <strong style={{ color: '#006b52' }}>TERMASUK</strong>
                  </div>
                  <div className="ka-summary-divider" />
                  <div className="ka-summary-total">
                    <span>Total Pembayaran</span>
                    <span className="ka-total-amount">{formatRupiah(totalPrice)}</span>
                  </div>
                </div>

                <div className="ka-checkout-options">
                  <button
                    type="button"
                    className="ka-btn-instant-buy"
                    onClick={() => {
                      alert(`Pesanan berhasil diproses untuk ${shoe.name} (Ukuran ${getSizeLabel(selectedSize)}).\n\nMetode Pengiriman: ${shippingMethod === 'express' ? '⚡ Express (1-2 hari kerja)' : '📦 Standard (3-5 hari kerja)'}\nTotal: ${formatRupiah(totalPrice)}\n\nAdmin ZedConsign akan menghubungi Anda untuk instruksi pembayaran escrow dan nomor resi pengiriman.`)
                      setShowCheckoutModal(false)
                      onClose()
                    }}
                  >
                    Beli Langsung ({formatRupiah(totalPrice)})
                  </button>

                  <button
                    type="button"
                    className="ka-btn-make-offer"
                    onClick={() => {
                      const offer = prompt(`Masukkan tawaran harga Anda untuk ${shoe.name} (Ukuran ${getSizeLabel(selectedSize)}):`, formatRupiah(Math.round(currentPrice * 0.9)))
                      if (offer) {
                        alert(`Tawaran Anda sebesar ${offer} telah dikirim ke consignor. Anda akan mendapatkan notifikasi saat disetujui!`)
                        setShowCheckoutModal(false)
                      }
                    }}
                  >
                    Ajukan Penawaran (Make an Offer)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShoeModal
