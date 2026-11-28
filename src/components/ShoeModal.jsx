import { useState, useEffect, useMemo } from 'react'
import { formatRupiah } from '../data/shoes.js'
import { saveOrder } from '../lib/orders.js'

function ShoeModal({ shoe, onClose, onNavigateConsign, currentUser, onOpenAuth }) {
  const [sizeUnit, setSizeUnit] = useState('US') // 'US' | 'EU' | 'UK'
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0) // Default to first available size
  const [shippingMethod, setShippingMethod] = useState(shoe?.isExpress ? 'express' : 'standard') // 'express' | 'standard'
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(24)
  const [showSizeChart, setShowSizeChart] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [copyToast, setCopyToast] = useState(false)

  // Checkout flow state: 'review' -> 'verify' -> 'payment' -> 'success'
  const [checkoutStep, setCheckoutStep] = useState('review')

  // Double Verification state
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('Jl. Jenderal Sudirman No. 41, Senayan, Jakarta Selatan 10210')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [verifyConfirmedData, setVerifyConfirmedData] = useState(false)
  const [verifyConfirmed2FA, setVerifyConfirmed2FA] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState('849201')
  const [inputOtp, setInputOtp] = useState('')
  const [otpSentToast, setOtpSentToast] = useState(false)
  const [verifyError, setVerifyError] = useState('')

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('qris') // 'qris' | 'bca_va' | 'mandiri_va' | 'bri_va' | 'gopay'
  const [paymentCountdown, setPaymentCountdown] = useState(86395) // 23:59:55
  const [vaCopied, setVaCopied] = useState(false)
  const [amountCopied, setAmountCopied] = useState(false)
  const [orderNumber, setOrderNumber] = useState('INV/ZC-2026/8942')
  const [receiptUploaded, setReceiptUploaded] = useState(false)
  const [paymentProofImage, setPaymentProofImage] = useState('')
  const [paymentProofError, setPaymentProofError] = useState('')

  // Sync buyer info from logged in user
  useEffect(() => {
    if (currentUser) {
      setBuyerName(currentUser.fullName || currentUser.user_metadata?.full_name || '')
      setBuyerPhone(currentUser.phone || currentUser.user_metadata?.phone || '081234567890')
    }
  }, [currentUser])

  // Payment Countdown Timer
  useEffect(() => {
    let timer
    if (showCheckoutModal && checkoutStep === 'payment') {
      timer = setInterval(() => {
        setPaymentCountdown((prev) => (prev > 0 ? prev - 1 : 86400))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [showCheckoutModal, checkoutStep])

  const formatCountdown = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
    const s = String(seconds % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const handleStartBuy = () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth('login')
      return
    }
    setCheckoutStep('review')
    setVerifyError('')
    setShowCheckoutModal(true)
  }

  const handleResendOtp = () => {
    const newCode = String(Math.floor(100000 + Math.random() * 900000))
    setGeneratedOtp(newCode)
    setInputOtp('')
    setOtpSentToast(true)
    setTimeout(() => setOtpSentToast(false), 2500)
  }

  const handleAutofillOtp = () => {
    setInputOtp(generatedOtp)
  }

  const handleCopyVa = (vaNumber) => {
    try {
      navigator.clipboard.writeText(vaNumber)
      setVaCopied(true)
      setTimeout(() => setVaCopied(false), 2000)
    } catch {
      alert(`Nomor VA tersalin: ${vaNumber}`)
    }
  }

  const handleCopyAmount = (amount) => {
    try {
      navigator.clipboard.writeText(amount.toString())
      setAmountCopied(true)
      setTimeout(() => setAmountCopied(false), 2000)
    } catch {
      alert(`Nominal tersalin: ${amount}`)
    }
  }

  const handleProceedToPayment = () => {
    setVerifyError('')
    if (!buyerName.trim()) {
      setVerifyError('Mohon lengkapi nama penerima paket.')
      return
    }
    if (!buyerPhone.trim()) {
      setVerifyError('Mohon isi nomor HP / WhatsApp aktif penerima.')
      return
    }
    if (!shippingAddress.trim()) {
      setVerifyError('Mohon masukkan alamat lengkap pengiriman.')
      return
    }
    if (!verifyConfirmedData) {
      setVerifyError('Silakan setujui Verifikasi 1 (Konfirmasi data pesanan & ukuran).')
      return
    }
    if (inputOtp.trim() !== generatedOtp) {
      setVerifyError(`Kode OTP tidak sesuai! Masukkan kode OTP: ${generatedOtp}`)
      return
    }
    if (!verifyConfirmed2FA) {
      setVerifyError('Silakan centang Verifikasi 2 (Persetujuan keamanan transaksi).')
      return
    }
    const newOrderNum = `INV/ZC-2026/${Math.floor(10000 + Math.random() * 90000)}`
    setOrderNumber(newOrderNum)
    setPaymentProofError('')
    setCheckoutStep('payment')
  }

  const handleProofUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const rawDataUrl = event.target.result
      // Kompres otomatis gambar struk/kamera HP via canvas agar ukuran ringan (< 80KB) dan tidak melampaui kuota HP
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxDim = 800
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL('image/jpeg', 0.72)
          setPaymentProofImage(compressed)
          setPaymentProofError('')
        } catch {
          setPaymentProofImage(rawDataUrl)
          setPaymentProofError('')
        }
      }
      img.onerror = () => {
        setPaymentProofImage(rawDataUrl)
        setPaymentProofError('')
      }
      img.src = rawDataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleUseSampleProof = () => {
    const sampleReceiptSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380"><rect width="300" height="380" fill="%23f8fafc"/><rect x="15" y="15" width="270" height="350" rx="8" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="150" y="50" font-family="Arial" font-size="15" font-weight="bold" fill="%230f172a" text-anchor="middle">BUKTI TRANSFER BERHASIL</text><text x="150" y="72" font-family="Arial" font-size="12" fill="%23006b52" font-weight="bold" text-anchor="middle">ZED CONSIGN ESCROW</text><line x1="30" y1="90" x2="270" y2="90" stroke="%23e2e8f0" stroke-width="1.5" stroke-dasharray="4"/><text x="30" y="120" font-family="Arial" font-size="11" fill="%2364748b">Nominal:</text><text x="270" y="120" font-family="Arial" font-size="13" font-weight="bold" fill="%230f172a" text-anchor="end">${formatRupiah(totalPrice)}</text><text x="30" y="150" font-family="Arial" font-size="11" fill="%2364748b">Metode:</text><text x="270" y="150" font-family="Arial" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="end">${paymentMethod === 'qris' ? 'QRIS Instant' : 'Virtual Account'}</text><text x="30" y="180" font-family="Arial" font-size="11" fill="%2364748b">Penerima:</text><text x="270" y="180" font-family="Arial" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="end">PT ZED CONSIGN</text><text x="30" y="210" font-family="Arial" font-size="11" fill="%2364748b">Pengirim:</text><text x="270" y="210" font-family="Arial" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="end">${buyerName || 'Pembeli'}</text><text x="30" y="240" font-family="Arial" font-size="11" fill="%2364748b">Status:</text><text x="270" y="240" font-family="Arial" font-size="12" font-weight="bold" fill="%23059669" text-anchor="end">BERHASIL / LUNAS</text><circle cx="150" cy="300" r="24" fill="%23ecfdf5" stroke="%23a7f3d0"/><text x="150" y="307" font-family="Arial" font-size="20" text-anchor="middle" fill="%23047857">✓</text></svg>`
    setPaymentProofImage(sampleReceiptSvg)
    setPaymentProofError('')
  }

  const handleConfirmPaid = () => {
    if (!paymentProofImage) {
      setPaymentProofError('Mohon kirim / unggah foto bukti transfer pembayaran terlebih dahulu sebelum melanjutkan!')
      return
    }
    setPaymentProofError('')

    try {
      const newOrderRecord = {
        id: orderNumber || `INV/ZC-2026/${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        shoeId: shoe.id,
        shoeName: shoe.name,
        shoeBrand: shoe.brand,
        shoeImage: (Array.isArray(shoe.images) && shoe.images[0]) || shoe.image || '',
        shoeImages: Array.isArray(shoe.images) && shoe.images.length > 0 ? shoe.images : [shoe.image || ''],
        size: getSizeLabel(selectedSize),
        condition: shoe.condition,
        price: currentPrice,
        shippingCost: shippingFee,
        shippingType: shippingMethod === 'express' ? '⚡ Express Shipping (1-2 Hari Kerja dari Vault)' : '📦 Standard Shipping (3-5 Hari Kerja)',
        trackingNumber: `ZC-${shippingMethod === 'express' ? 'EXP' : 'REG'}-${Math.floor(100000 + Math.random() * 900000)}ID`,
        courier: shippingMethod === 'express' ? 'JNE Express x ZedConsign Courier' : 'SiCepat Cargo Reguler',
        status: 'Menunggu ACC Vault',
        deliveryStatus: 'Menunggu Verifikasi & Pengiriman Vault',
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        buyerName: buyerName || (currentUser?.fullName || 'Member ZedConsign'),
        buyerPhone: buyerPhone || (currentUser?.phone || '081234567890'),
        shippingAddress: shippingAddress || 'Jl. Prof. Soedarto No. 13, Tembalang, Kota Semarang, Jawa Tengah 50275',
        paymentMethod: paymentMethod === 'qris' ? 'QRIS Instant BCA' : paymentMethod.replace('_', ' ').toUpperCase(),
        vaultVerificationTag: `ZC-AUTH-${Math.floor(100000 + Math.random() * 900000)}-VAULT`,
        verifiedBy: 'Chief Authenticator ZedConsign Vault',
        paymentProof: paymentProofImage,
      }
      saveOrder(newOrderRecord, currentUser)
    } catch (e) {
      console.warn('Gagal mencatat pesanan:', e)
    }
    setCheckoutStep('success')
  }
  
  // Multi-photo gallery support (up to 8 detail photos)
  const shoePhotos = useMemo(() => {
    if (Array.isArray(shoe?.images) && shoe.images.length > 0) {
      return shoe.images
    }
    if (shoe?.image) {
      return [shoe.image]
    }
    return ['data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23f8fafc"/><text x="150" y="160" font-family="Arial" font-size="40" fill="%2394a3b8" text-anchor="middle">👟</text></svg>']
  }, [shoe])

  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(null)

  // Reset active photo when shoe changes
  useEffect(() => {
    setActivePhotoIndex(0)
  }, [shoe?.id])

  const handlePrevPhoto = (e) => {
    e?.stopPropagation()
    setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : shoePhotos.length - 1))
  }

  const handleNextPhoto = (e) => {
    e?.stopPropagation()
    setActivePhotoIndex((prev) => (prev < shoePhotos.length - 1 ? prev + 1 : 0))
  }

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX
    if (diff > 45) {
      handleNextPhoto()
    } else if (diff < -45) {
      handlePrevPhoto()
    }
    setTouchStartX(null)
  }

  // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
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
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : shoePhotos.length - 1))
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev < shoePhotos.length - 1 ? prev + 1 : 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, showCheckoutModal, showSizeChart, shoePhotos.length])

  // Computed size items: persis 1 unit / 1 pasang (1 pc) sesuai objek sepatu yang diunggah
  const sizeItems = useMemo(() => {
    if (!shoe) return []

    const shoeSize = shoe.size ? shoe.size.trim() : 'US 9 / EU 42.5'
    const shoePrice = Number(shoe.price) || 0
    const shoeStock = Number(shoe.stock) > 0 ? Number(shoe.stock) : 1

    return [
      {
        id: 0,
        label: shoeSize,
        us: shoeSize,
        eu: shoeSize,
        uk: shoeSize,
        price: shoePrice,
        strikePrice: Math.round(shoePrice * 1.15),
        stock: shoeStock,
        express: Boolean(shoe.isExpress),
        bestPrice: true,
      },
    ]
  }, [shoe])

  if (!shoe) return null

  const selectedSize = sizeItems[selectedSizeIndex] || sizeItems[0] || { label: shoe.size || 'One Size', price: Number(shoe.price) || 0 }
  const currentPrice = selectedSize ? Number(selectedSize.price) : (Number(shoe.price) || 2000000)
  const shippingFee = shippingMethod === 'express' ? 45000 : 20000
  const totalPrice = currentPrice + shippingFee

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
    if (!item) return shoe?.size || 'One Size'
    if (item.label) return item.label
    if (sizeUnit === 'EU' && item.eu) return `EU ${item.eu}`
    if (sizeUnit === 'UK' && item.uk) return `UK ${item.uk}`
    return `US ${item.us || item.label || ''}`
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
          {/* LEFT COLUMN: Large Sneaker Showcase with Gallery Chevron & Detail Photos */}
          <div className="ka-col-gallery">
            <div
              className="ka-image-showcase-box"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Photo Counter Badge */}
              <div className="ka-photo-counter-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>Foto {activePhotoIndex + 1} / {shoePhotos.length}</span>
              </div>

              <img
                src={shoePhotos[activePhotoIndex]}
                alt={`${shoe.name} - Foto ${activePhotoIndex + 1}`}
                className="ka-main-shoe-img"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23f8fafc"/><text x="150" y="160" font-family="Arial" font-size="40" fill="%2394a3b8" text-anchor="middle">👟</text></svg>'
                }}
              />

              {/* Gallery Angle Prev Chevron */}
              {shoePhotos.length > 1 && (
                <button
                  type="button"
                  className="ka-gallery-prev-chevron"
                  onClick={handlePrevPhoto}
                  title="Foto sebelumnya"
                  aria-label="Lihat foto sebelumnya"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}

              {/* Gallery Angle Next Chevron */}
              {shoePhotos.length > 1 && (
                <button
                  type="button"
                  className="ka-gallery-next-chevron"
                  onClick={handleNextPhoto}
                  title="Foto berikutnya"
                  aria-label="Lihat foto berikutnya"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}

              {/* Angle / Dots Indicators */}
              <div className="ka-angle-dots">
                {shoePhotos.map((_, idx) => (
                  <span
                    key={idx}
                    className={`ka-angle-dot ${idx === activePhotoIndex ? 'active' : ''}`}
                    onClick={() => setActivePhotoIndex(idx)}
                    title={`Lihat foto ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Thumbnail Strip for up to 8 Detail Photos */}
            {shoePhotos.length > 1 && (
              <div className="ka-thumbnails-strip">
                {shoePhotos.map((imgSrc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`ka-thumb-item ${idx === activePhotoIndex ? 'active' : ''}`}
                    onClick={() => setActivePhotoIndex(idx)}
                    title={`Lihat foto detail ${idx + 1}`}
                  >
                    <img
                      src={imgSrc}
                      alt={`Thumbnail ${idx + 1}`}
                      className="ka-thumb-img"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23f1f5f9"/><text x="30" y="36" font-family="Arial" font-size="18" fill="%2394a3b8" text-anchor="middle">👟</text></svg>'
                      }}
                    />
                    <span className="ka-thumb-number">#{idx + 1}</span>
                  </button>
                ))}
              </div>
            )}

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

              {/* Size Cards Grid */}
              <div
                className="ka-size-cards-grid"
                style={
                  sizeItems.length === 1
                    ? { display: 'grid', gridTemplateColumns: 'minmax(200px, 300px)' }
                    : undefined
                }
              >
                {sizeItems.map((item, index) => {
                  const isSelected = index === selectedSizeIndex
                  return (
                    <div
                      key={item.id ?? index}
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

                      {/* Bottom: Stock status or Best Price Tag */}
                      <div className="ka-size-card-bottom">
                        <span className="ka-best-price-tag">
                          {Number(item.stock) > 1 ? `Stok: ${item.stock} Pairs` : 'Tersedia 1 Pasang (1 pc)'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {sizeItems.length === 1 && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginTop: '10px',
                    fontSize: '12px',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>👟</span>
                  <span>
                    Unit ini tersedia <strong>1 pasang (1 pc)</strong> dengan ukuran{' '}
                    <strong>{getSizeLabel(sizeItems[0])}</strong> &bull; Kondisi <strong>{shoe.condition}</strong>.
                  </span>
                </div>
              )}
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
                  if (!currentUser) {
                    if (onOpenAuth) onOpenAuth('login')
                    return
                  }
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
                onClick={handleStartBuy}
              >
                {!currentUser ? 'Masuk untuk Beli (Buy)' : 'Buy or Offer'}
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
            BUY & CHECKOUT MODAL WITH DOUBLE VERIFICATION & PAYMENT PAGE
            ========================================================================== */}
        {showCheckoutModal && (
          <div className="ka-sub-modal-backdrop" onClick={() => setShowCheckoutModal(false)}>
            <div className="ka-sub-modal-window checkout-modal-window" onClick={(e) => e.stopPropagation()}>
              
              {/* Stepper Wizard Header */}
              <div className="checkout-wizard-header">
                <div className="wizard-stepper-strip">
                  <div className={`wizard-step-node ${checkoutStep === 'review' ? 'active' : ''} ${['verify', 'payment', 'success'].includes(checkoutStep) ? 'done' : ''}`}>
                    <span className="step-circle">{['verify', 'payment', 'success'].includes(checkoutStep) ? '✓' : '1'}</span>
                    <span className="step-label">Ringkasan</span>
                  </div>
                  <div className="wizard-connector" />
                  <div className={`wizard-step-node ${checkoutStep === 'verify' ? 'active' : ''} ${['payment', 'success'].includes(checkoutStep) ? 'done' : ''}`}>
                    <span className="step-circle">{['payment', 'success'].includes(checkoutStep) ? '✓' : '2'}</span>
                    <span className="step-label">Verifikasi</span>
                  </div>
                  <div className="wizard-connector" />
                  <div className={`wizard-step-node ${checkoutStep === 'payment' ? 'active' : ''} ${checkoutStep === 'success' ? 'done' : ''}`}>
                    <span className="step-circle">{checkoutStep === 'success' ? '✓' : '3'}</span>
                    <span className="step-label">Pembayaran</span>
                  </div>
                  <div className="wizard-connector" />
                  <div className={`wizard-step-node ${checkoutStep === 'success' ? 'active done' : ''}`}>
                    <span className="step-circle">4</span>
                    <span className="step-label">Selesai</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="ka-close-btn"
                  onClick={() => setShowCheckoutModal(false)}
                  title="Tutup Checkout"
                >
                  &times;
                </button>
              </div>

              {/* Toast Notification for OTP / Copy */}
              {otpSentToast && (
                <div className="checkout-toast-banner">
                  <span>📩 Kode OTP Verifikasi Baru telah dikirimkan ke {buyerPhone || 'WhatsApp Anda'}!</span>
                </div>
              )}
              {vaCopied && (
                <div className="checkout-toast-banner">
                  <span>✓ Nomor Virtual Account berhasil disalin ke clipboard!</span>
                </div>
              )}
              {amountCopied && (
                <div className="checkout-toast-banner">
                  <span>✓ Total nominal pembayaran berhasil disalin!</span>
                </div>
              )}

              {/* ====================================================================
                  STEP 1: RINGKASAN PESANAN (ORDER REVIEW)
                  ==================================================================== */}
              {checkoutStep === 'review' && (
                <div className="ka-checkout-body">
                  <div className="checkout-step-title-wrap">
                    <h3>Ringkasan Pesanan Pembelian</h3>
                    <p>Periksa detail ukuran, metode pengiriman, dan rincian harga sebelum lanjut.</p>
                  </div>

                  <div className="ka-checkout-product-row">
                    <img
                      src={shoe.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70"><rect width="70" height="70" fill="%23f8fafc"/><text x="35" y="42" font-family="Arial" font-size="22" fill="%2394a3b8" text-anchor="middle">👟</text></svg>'}
                      alt={shoe.name}
                      className="ka-checkout-thumb"
                    />
                    <div style={{ flex: 1 }}>
                      <h4 className="ka-checkout-name">{shoe.name}</h4>
                      <p className="ka-checkout-size">
                        Ukuran Terpilih: <strong>{getSizeLabel(selectedSize)}</strong>{selectedSize.cm ? ` (${selectedSize.cm} cm)` : ''}
                      </p>
                      <p className="ka-checkout-condition">Kondisi: {shoe.condition}</p>
                      <span className="ka-verified-badge-mini">100% Authentic Verified</span>
                    </div>
                  </div>

                  {/* Checkout Shipping Toggle */}
                  <div className="ka-checkout-shipping-select">
                    <label className="ka-checkout-shipping-label">Pilih Opsi Pengiriman:</label>
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
                      <span>Ongkos Kirim ({shippingMethod === 'express' ? '⚡ Express 1-2 Hari' : '📦 Standard 3-5 Hari'})</span>
                      <strong>{formatRupiah(shippingFee)}</strong>
                    </div>
                    <div className="ka-summary-line">
                      <span>Biaya Kurasi & Autentikasi Fisik</span>
                      <strong style={{ color: '#006b52' }}>GRATIS</strong>
                    </div>
                    <div className="ka-summary-line">
                      <span>Garansi Escrow & Perlindungan Pembeli</span>
                      <strong style={{ color: '#006b52' }}>TERMASUK</strong>
                    </div>
                    <div className="ka-summary-divider" />
                    <div className="ka-summary-total">
                      <span>Total Pembayaran</span>
                      <span className="ka-total-amount">{formatRupiah(totalPrice)}</span>
                    </div>
                  </div>

                  <div className="checkout-buyer-indicator">
                    <span className="buyer-icon">👤</span>
                    <div>
                      <small>Akun Pembeli:</small>
                      <strong>{buyerName || currentUser?.fullName || currentUser?.email}</strong>
                    </div>
                  </div>

                  <div className="checkout-action-btns">
                    <button
                      type="button"
                      className="btn-primary-checkout"
                      onClick={() => {
                        setCheckoutStep('verify')
                        setVerifyError('')
                      }}
                    >
                      Lanjut ke Double Verifikasi Keamanan ➔
                    </button>
                  </div>
                </div>
              )}

              {/* ====================================================================
                  STEP 2: DOUBLE VERIFIKASI KEAMANAN (2-STEP VERIFICATION)
                  ==================================================================== */}
              {checkoutStep === 'verify' && (
                <div className="ka-checkout-body">
                  <div className="checkout-step-title-wrap">
                    <div className="double-verify-pill-badge">
                      <span className="shield-icon">🛡️</span> Double Verification Active
                    </div>
                    <h3>Verifikasi 2 Langkah Sebelum Pembayaran</h3>
                    <p>Konfirmasi identitas pengiriman dan otorisasi keamanan transaksi untuk perlindungan penuh escrow.</p>
                  </div>

                  {verifyError && (
                    <div className="auth-error-banner" style={{ marginBottom: '14px' }}>
                      <span>⚠️ {verifyError}</span>
                    </div>
                  )}

                  {/* VERIFIKASI 1: Identitas & Alamat Tujuan */}
                  <div className="verify-box-card">
                    <div className="verify-box-header">
                      <span className="verify-badge-num">1</span>
                      <div>
                        <h4>Verifikasi Identitas &amp; Alamat Pengiriman</h4>
                        <p>Pastikan nama dan nomor penerima dapat dihubungi kurir saat pengantaran.</p>
                      </div>
                    </div>

                    <div className="verify-box-fields">
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">Nama Lengkap Penerima *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Contoh: Shiddiq Yazid Nurhakim"
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">Nomor WhatsApp / HP Aktif *</label>
                          <input
                            type="tel"
                            className="form-input"
                            placeholder="Contoh: 081234567890"
                            value={buyerPhone}
                            onChange={(e) => setBuyerPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Alamat Lengkap Pengiriman *</label>
                        <textarea
                          className="form-textarea"
                          rows="2"
                          placeholder="Jalan, Nomor Rumah, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos..."
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Catatan Pengiriman (Opsional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Contoh: Titipkan di satpam jika tidak ada orang / hubungi sebelum antar"
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                        />
                      </div>

                      <label className="verify-checkbox-wrap">
                        <input
                          type="checkbox"
                          checked={verifyConfirmedData}
                          onChange={(e) => setVerifyConfirmedData(e.target.checked)}
                        />
                        <span>
                          <strong>Verifikasi 1:</strong> Saya mengonfirmasi bahwa data penerima, alamat, dan ukuran sepatu (<strong>{getSizeLabel(selectedSize)}</strong>) sudah benar dan akurat.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* VERIFIKASI 2: Kode Keamanan OTP Transaksi */}
                  <div className="verify-box-card" style={{ marginTop: '16px' }}>
                    <div className="verify-box-header">
                      <span className="verify-badge-num">2</span>
                      <div>
                        <h4>Verifikasi Kode Keamanan Transaksi (OTP)</h4>
                        <p>Otorisasi transaksi escrow 2-faktor untuk menjamin pesanan dilakukan oleh pemilik akun.</p>
                      </div>
                    </div>

                    <div className="verify-box-fields">
                      <div className="otp-generator-banner">
                        <div className="otp-banner-left">
                          <small>Kode Keamanan Transaksi Anda:</small>
                          <strong className="otp-display-code">{generatedOtp}</strong>
                        </div>
                        <div className="otp-banner-actions">
                          <button
                            type="button"
                            className="btn-autofill-otp"
                            onClick={handleAutofillOtp}
                            title="Masukkan otomatis kode di atas"
                          >
                            Isi Otomatis
                          </button>
                          <button
                            type="button"
                            className="btn-resend-otp"
                            onClick={handleResendOtp}
                          >
                            Kirim Ulang
                          </button>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginTop: '10px' }}>
                        <label className="form-label">Masukkan 6-Digit Kode OTP Keamanan *</label>
                        <input
                          type="text"
                          maxLength={6}
                          className="form-input otp-input-field"
                          placeholder="849201"
                          value={inputOtp}
                          onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>

                      <label className="verify-checkbox-wrap">
                        <input
                          type="checkbox"
                          checked={verifyConfirmed2FA}
                          onChange={(e) => setVerifyConfirmed2FA(e.target.checked)}
                        />
                        <span>
                          <strong>Verifikasi 2:</strong> Saya menyetujui syarat transaksi konsinyasi dan perlindungan escrow ZedConsign 100% Authentic.
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="checkout-action-row">
                    <button
                      type="button"
                      className="btn-back-checkout"
                      onClick={() => setCheckoutStep('review')}
                    >
                      ← Kembali
                    </button>
                    <button
                      type="button"
                      className="btn-primary-checkout"
                      onClick={handleProceedToPayment}
                    >
                      Verifikasi &amp; Lanjut ke Pembayaran 💳
                    </button>
                  </div>
                </div>
              )}

              {/* ====================================================================
                  STEP 3: HALAMAN PEMBAYARAN (PAYMENT PAGE)
                  ==================================================================== */}
              {checkoutStep === 'payment' && (
                <div className="ka-checkout-body">
                  <div className="payment-top-card">
                    <div className="payment-invoice-row">
                      <div>
                        <span className="pay-inv-label">No. Invoice Pesanan:</span>
                        <strong className="pay-inv-code">{orderNumber}</strong>
                      </div>
                      <span className="payment-status-pill">Menunggu Pembayaran</span>
                    </div>

                    <div className="payment-countdown-box">
                      <span>⏱️ Selesaikan pembayaran dalam:</span>
                      <strong className="countdown-clock">{formatCountdown(paymentCountdown)}</strong>
                    </div>

                    <div className="payment-total-banner">
                      <div>
                        <small>Total Tagihan Pembayaran:</small>
                        <h2 className="payment-total-sum">{formatRupiah(totalPrice)}</h2>
                      </div>
                      <button
                        type="button"
                        className="btn-copy-amount"
                        onClick={() => handleCopyAmount(totalPrice)}
                      >
                        Salin Nominal
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Switcher */}
                  <div className="payment-method-selector">
                    <label className="ka-checkout-shipping-label">Pilih Metode Pembayaran Escrow:</label>
                    <div className="payment-tabs-strip">
                      <button
                        type="button"
                        className={`payment-tab-btn ${paymentMethod === 'qris' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('qris')}
                      >
                        📱 QRIS Instant
                      </button>
                      <button
                        type="button"
                        className={`payment-tab-btn ${paymentMethod === 'bca_va' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('bca_va')}
                      >
                        🏦 BCA Virtual Account
                      </button>
                      <button
                        type="button"
                        className={`payment-tab-btn ${paymentMethod === 'mandiri_va' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('mandiri_va')}
                      >
                        🏦 Mandiri VA
                      </button>
                      <button
                        type="button"
                        className={`payment-tab-btn ${paymentMethod === 'bri_va' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('bri_va')}
                      >
                        🏦 BRI Virtual Account
                      </button>
                    </div>
                  </div>

                  {/* Method 1: QRIS Display */}
                  {paymentMethod === 'qris' && (
                    <div className="payment-detail-card qris-center-card">
                      <div className="qris-badge-header">
                        <span className="qris-brand-logo">QRIS</span>
                        <span className="qris-gpn-logo">GPN</span>
                        <span className="qris-merchant-title">PT ZED CONSIGN INDONESIA</span>
                      </div>

                      {/* Realistic QRIS Graphic SVG */}
                      <div className="qris-graphic-box">
                        <svg className="qris-svg" viewBox="0 0 200 200" width="180" height="180">
                          <rect width="200" height="200" fill="#ffffff" rx="10" />
                          {/* Corner Markers */}
                          <rect x="15" y="15" width="45" height="45" fill="#111827" rx="6" />
                          <rect x="23" y="23" width="29" height="29" fill="#ffffff" rx="3" />
                          <rect x="29" y="29" width="17" height="17" fill="#111827" rx="2" />

                          <rect x="140" y="15" width="45" height="45" fill="#111827" rx="6" />
                          <rect x="148" y="23" width="29" height="29" fill="#ffffff" rx="3" />
                          <rect x="154" y="29" width="17" height="17" fill="#111827" rx="2" />

                          <rect x="15" y="140" width="45" height="45" fill="#111827" rx="6" />
                          <rect x="23" y="148" width="29" height="29" fill="#ffffff" rx="3" />
                          <rect x="29" y="154" width="17" height="17" fill="#111827" rx="2" />

                          {/* Data Pattern Simulation */}
                          <rect x="70" y="20" width="10" height="10" fill="#111827" />
                          <rect x="90" y="20" width="10" height="10" fill="#111827" />
                          <rect x="115" y="20" width="10" height="10" fill="#111827" />
                          <rect x="70" y="45" width="10" height="20" fill="#111827" />
                          <rect x="95" y="45" width="15" height="10" fill="#111827" />
                          <rect x="120" y="45" width="10" height="10" fill="#111827" />

                          {/* Center Brand Monogram */}
                          <circle cx="100" cy="100" r="22" fill="#006b52" />
                          <text x="100" y="106" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">ZC</text>

                          {/* Bottom Patterns */}
                          <rect x="70" y="140" width="10" height="15" fill="#111827" />
                          <rect x="90" y="145" width="20" height="10" fill="#111827" />
                          <rect x="120" y="140" width="10" height="10" fill="#111827" />
                          <rect x="140" y="140" width="10" height="25" fill="#111827" />
                          <rect x="160" y="150" width="15" height="15" fill="#111827" />
                          <rect x="175" y="170" width="10" height="15" fill="#111827" />
                        </svg>
                      </div>

                      <div className="qris-instructions">
                        <p><strong>NMID:</strong> ID1020268849281</p>
                        <p>Buka aplikasi <strong>BCA Mobile, Livin, GoPay, OVO, ShopeePay, atau Dana</strong>, pilih menu <strong>Scan QR</strong> lalu arahkan kamera ke barcode di atas.</p>
                      </div>
                    </div>
                  )}

                  {/* Method 2: BCA Virtual Account */}
                  {paymentMethod === 'bca_va' && (
                    <div className="payment-detail-card va-card">
                      <div className="va-header-row">
                        <span className="va-bank-title">BCA Virtual Account</span>
                        <span className="va-badge-auto">Otomatis Verifikasi</span>
                      </div>
                      <div className="va-display-row">
                        <div>
                          <small>Nomor Virtual Account:</small>
                          <strong className="va-number-string">8274 0812 3456 7890</strong>
                        </div>
                        <button
                          type="button"
                          className="btn-copy-va"
                          onClick={() => handleCopyVa('8274081234567890')}
                        >
                          Salin No. VA
                        </button>
                      </div>
                      <div className="va-account-name">
                        <span>Nama Akun:</span> <strong>ZED CONSIGN - {buyerName || 'PEMBELI'}</strong>
                      </div>
                      <div className="va-guide-box">
                        <h5>Petunjuk Transfer m-BCA:</h5>
                        <ol>
                          <li>Buka aplikasi BCA Mobile &gt; pilih <strong>m-Transfer</strong>.</li>
                          <li>Pilih <strong>BCA Virtual Account</strong> &gt; masukkan <code>8274 0812 3456 7890</code>.</li>
                          <li>Pastikan nominal tagihan <strong>{formatRupiah(totalPrice)}</strong> sesuai lalu masukkan PIN m-BCA Anda.</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Method 3: Mandiri Virtual Account */}
                  {paymentMethod === 'mandiri_va' && (
                    <div className="payment-detail-card va-card">
                      <div className="va-header-row">
                        <span className="va-bank-title">Mandiri Virtual Account</span>
                        <span className="va-badge-auto">Otomatis Verifikasi</span>
                      </div>
                      <div className="va-display-row">
                        <div>
                          <small>Nomor Virtual Account:</small>
                          <strong className="va-number-string">8962 1234 5678 9012</strong>
                        </div>
                        <button
                          type="button"
                          className="btn-copy-va"
                          onClick={() => handleCopyVa('8962123456789012')}
                        >
                          Salin No. VA
                        </button>
                      </div>
                      <div className="va-account-name">
                        <span>Nama Perusahaan / Akun:</span> <strong>ZED CONSIGN ESCROW</strong>
                      </div>
                      <div className="va-guide-box">
                        <h5>Petunjuk Transfer Livin by Mandiri:</h5>
                        <ol>
                          <li>Buka Livin' by Mandiri &gt; menu <strong>Bayar</strong> &gt; cari <strong>ZedConsign</strong>.</li>
                          <li>Masukkan No. VA <code>8962 1234 5678 9012</code> &gt; Lanjut.</li>
                          <li>Periksa nominal tagihan <strong>{formatRupiah(totalPrice)}</strong> dan konfirmasi PIN.</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Method 4: BRI Virtual Account */}
                  {paymentMethod === 'bri_va' && (
                    <div className="payment-detail-card va-card">
                      <div className="va-header-row">
                        <span className="va-bank-title">BRI Virtual Account (BRIVA)</span>
                        <span className="va-badge-auto">Otomatis Verifikasi</span>
                      </div>
                      <div className="va-display-row">
                        <div>
                          <small>Nomor BRIVA:</small>
                          <strong className="va-number-string">1234 5678 9012 3456</strong>
                        </div>
                        <button
                          type="button"
                          className="btn-copy-va"
                          onClick={() => handleCopyVa('1234567890123456')}
                        >
                          Salin No. VA
                        </button>
                      </div>
                      <div className="va-account-name">
                        <span>Institusi:</span> <strong>BRIVA ZED CONSIGN OFFICIAL</strong>
                      </div>
                      <div className="va-guide-box">
                        <h5>Petunjuk Transfer BRImo:</h5>
                        <ol>
                          <li>Login ke aplikasi BRImo &gt; pilih menu <strong>BRIVA</strong>.</li>
                          <li>Pilih Tambah Transaksi Baru &gt; Masukkan No. BRIVA <code>1234 5678 9012 3456</code>.</li>
                          <li>Periksa detail pembayaran <strong>{formatRupiah(totalPrice)}</strong> &gt; Konfirmasi PIN.</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Escrow Guarantee Security Card */}
                  <div className="escrow-safe-card">
                    <span className="escrow-safe-icon">🛡️</span>
                    <div>
                      <strong>Garansi Keamanan Escrow ZedConsign</strong>
                      <p>Dana Anda disimpan dalam rekening penampungan aman (escrow). Penjual baru akan menerima pembayaran setelah unit sepatu kami terima, lulus pengecekan keaslian fisik 100%, dan sampai di tangan Anda.</p>
                    </div>
                  </div>

                  {/* Upload Bukti Pembayaran / Transfer (Wajib) */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: paymentProofError
                        ? '2px solid #ef4444'
                        : paymentProofImage
                        ? '2px solid #006b52'
                        : '1.5px dashed #006b52',
                      borderRadius: '14px',
                      padding: '18px',
                      margin: '18px 0',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px',
                      }}
                    >
                      <label
                        style={{
                          fontSize: '13.5px',
                          fontWeight: '800',
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>📸</span>
                        <span>Upload Foto Bukti Transfer / Bayar * (Wajib)</span>
                      </label>
                      {paymentProofImage && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            color: '#047857',
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                          }}
                        >
                          ✓ Bukti Terlampir
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        margin: '0 0 12px',
                        lineHeight: '1.5',
                      }}
                    >
                      Wajib mengunggah tangkapan layar (screenshot) struk m-Banking,
                      bukti transfer ATM, atau notifikasi sukses QRIS Anda untuk
                      dapat melanjutkan ke halaman konfirmasi berikutnya.
                    </p>

                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      id="payment-proof-file-input"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleProofUpload}
                    />

                    {/* State A: Belum Unggah */}
                    {!paymentProofImage ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() =>
                            document.getElementById('payment-proof-file-input')?.click()
                          }
                          style={{
                            width: '100%',
                            padding: '18px 14px',
                            border: '1.5px dashed #006b52',
                            borderRadius: '10px',
                            background: 'rgba(0, 107, 82, 0.04)',
                            color: '#006b52',
                            fontWeight: '800',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ fontSize: '26px' }}>📤</span>
                          <span>Pilih Foto Bukti Bayar dari Galeri / Kamera</span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#64748b',
                              fontWeight: '500',
                            }}
                          >
                            Format JPG, PNG, atau WEBP (Maksimal 10MB)
                          </span>
                        </button>

                        {/* Quick Demo Sample Button */}
                        <button
                          type="button"
                          onClick={handleUseSampleProof}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: '700',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>🖼️</span>
                          <span>Gunakan Sampel Struk Pembayaran Demo</span>
                        </button>
                      </div>
                    ) : (
                      /* State B: Sudah Unggah (Preview & Action) */
                      <div
                        style={{
                          display: 'flex',
                          gap: '14px',
                          alignItems: 'center',
                          background: '#f8fafc',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <img
                          src={paymentProofImage}
                          alt="Bukti Bayar"
                          style={{
                            width: '85px',
                            height: '85px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong
                            style={{
                              fontSize: '13px',
                              color: '#0f172a',
                              display: 'block',
                              marginBottom: '2px',
                            }}
                          >
                            Foto Bukti Pembayaran Siap Dikirim
                          </strong>
                          <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                            Struk transfer terlampir &bull; Siap diverifikasi oleh tim kurator.
                          </span>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() =>
                                document
                                  .getElementById('payment-proof-file-input')
                                  ?.click()
                              }
                              style={{
                                padding: '5px 12px',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              Ganti Foto
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentProofImage('')
                                setPaymentProofError('')
                              }}
                              style={{
                                padding: '5px 12px',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                background: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error Notice */}
                    {paymentProofError && (
                      <div
                        style={{
                          marginTop: '10px',
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#b91c1c',
                          fontSize: '12px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontWeight: '700',
                        }}
                      >
                        ⚠️ {paymentProofError}
                      </div>
                    )}
                  </div>

                  <div className="checkout-action-row">
                    <button
                      type="button"
                      className="btn-back-checkout"
                      onClick={() => setCheckoutStep('verify')}
                    >
                      ← Ubah Verifikasi
                    </button>
                    <button
                      type="button"
                      className="btn-confirm-payment-paid"
                      onClick={handleConfirmPaid}
                      style={{
                        background: !paymentProofImage
                          ? '#94a3b8'
                          : 'linear-gradient(135deg, #00dfa2 0%, #006b52 100%)',
                        color: !paymentProofImage ? '#ffffff' : '#0f172a',
                        cursor: !paymentProofImage ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {paymentProofImage
                        ? 'Saya Sudah Membayar (Lanjut ke Bukti Pesanan) ✓'
                        : 'Unggah Bukti Bayar Terlebih Dahulu ⚠️'}
                    </button>
                  </div>
                </div>
              )}

              {/* ====================================================================
                  STEP 4: HALAMAN BUKTI PEMBAYARAN / SUKSES (SUCCESS RECEIPT)
                  ==================================================================== */}
              {checkoutStep === 'success' && (
                <div className="ka-checkout-body">
                  <div className="payment-success-card">
                    <div className="success-badge-glow">
                      <div className="success-badge-inner">✓</div>
                    </div>
                    <h2 className="success-heading">Pembayaran Berhasil Dikonfirmasi!</h2>
                    <p className="success-sub">
                      Terima kasih! Pesanan Anda telah resmi diverifikasi oleh sistem escrow ZedConsign dan sedang diteruskan ke kurator untuk legit check fisik &amp; pengiriman.
                    </p>

                    {/* Official Digital Invoice Receipt */}
                    <div className="official-receipt-card" id="print-area-invoice">
                      <div className="receipt-brand-row">
                        <div className="receipt-brand">
                          <span className="brand-kick">ZED</span>
                          <span className="brand-avenue">CONSIGN</span>
                        </div>
                        <span className="receipt-status-pill">✓ LUNAS (ESCROW SECURED)</span>
                      </div>

                      <div className="receipt-grid">
                        <div className="receipt-item">
                          <small>Nomor Invoice</small>
                          <strong>{orderNumber}</strong>
                        </div>
                        <div className="receipt-item">
                          <small>No. Resi Pengiriman</small>
                          <strong>ZC-EXP-{Math.floor(100000 + Math.random() * 900000)}ID</strong>
                        </div>
                        <div className="receipt-item">
                          <small>Waktu Transaksi</small>
                          <span>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} &bull; {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                        </div>
                        <div className="receipt-item">
                          <small>Metode Pembayaran</small>
                          <span>{paymentMethod === 'qris' ? 'QRIS Instant' : paymentMethod.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <div className="receipt-item full-width">
                          <small>Produk Sepatu &amp; Ukuran</small>
                          <strong>{shoe.name} — {getSizeLabel(selectedSize)} ({shoe.condition})</strong>
                        </div>
                        <div className="receipt-item full-width">
                          <small>Penerima &amp; Alamat Tujuan</small>
                          <span>{buyerName} ({buyerPhone})<br />{shippingAddress}</span>
                        </div>
                        <div className="receipt-item full-width receipt-total-row">
                          <span>Total Terbayar Lunas:</span>
                          <strong className="receipt-final-amount">{formatRupiah(totalPrice)}</strong>
                        </div>
                      </div>

                      {/* Lampiran Bukti Transfer */}
                      {paymentProofImage && (
                        <div
                          style={{
                            marginTop: '16px',
                            background: '#f8fafc',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            textAlign: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              color: '#006b52',
                              display: 'block',
                              marginBottom: '6px',
                            }}
                          >
                            📷 FOTO BUKTI PEMBAYARAN TERLAMPIR:
                          </span>
                          <img
                            src={paymentProofImage}
                            alt="Bukti Transfer"
                            style={{
                              maxHeight: '120px',
                              maxWidth: '100%',
                              objectFit: 'contain',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="success-action-buttons">
                      <button
                        type="button"
                        className="btn-print-receipt"
                        onClick={() => window.print()}
                      >
                        🖨️ Cetak / Unduh Bukti Transaksi
                      </button>
                      <button
                        type="button"
                        className="btn-finish-catalog"
                        onClick={() => {
                          setShowCheckoutModal(false)
                          onClose()
                        }}
                      >
                        Selesai &amp; Kembali ke Katalog
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShoeModal
