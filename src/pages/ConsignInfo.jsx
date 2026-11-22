import { useState } from 'react'
import { formatRupiah, CATEGORIES, BRANDS } from '../data/shoes.js'
import ImageUploader from '../components/ImageUploader.jsx'

function ConsignInfo({ onAddShoe, onNavigateCatalog, onNavigateManage }) {
  // Calculator State
  const [askingPrice, setAskingPrice] = useState(2500000)
  const feeRate = 0.05 // 5% fee
  const feeAmount = askingPrice * feeRate
  const payoutAmount = askingPrice - feeAmount

  // Form Submission State
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('Nike')
  const [category, setCategory] = useState('Sneakers')
  const [size, setSize] = useState('US 9 / EU 42.5')
  const [condition, setCondition] = useState('Brand New In Box (BNIB)')
  const [price, setPrice] = useState('')
  const [images, setImages] = useState(['/shoes/dunk-low.svg'])
  const [consignor, setConsignor] = useState('')
  const [description, setDescription] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSellSubmit = (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!name.trim()) {
      setErrorMessage('Mohon masukkan nama sepatu!')
      return
    }

    const priceNum = Number(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage('Harga jual harus berupa angka valid di atas Rp 0!')
      return
    }

    const primaryImage = images[0] || '/shoes/dunk-low.svg'
    const finalImages = images.length > 0 ? images : [primaryImage]

    const newShoe = {
      id: `consign-${Date.now()}`,
      name: name.trim(),
      brand,
      category,
      size: size.trim(),
      condition,
      price: priceNum,
      image: primaryImage,
      images: finalImages,
      consignor: consignor.trim() || 'Verified Consignor',
      description: description.trim() || 'Sepatu titip jual terverifikasi kondisi autentik 100%.',
      stock: 1,
      isFeatured: false,
      isExpress: false,
    }

    if (onAddShoe) {
      onAddShoe(newShoe)
    }

    setSuccessMessage(`Sepatu "${newShoe.name}" berhasil didaftarkan dan langsung tayang di katalog ZedConsign dengan ${finalImages.length} foto detail!`)
    setName('')
    setPrice('')
    setDescription('')
    setConsignor('')
    setImages(['/shoes/dunk-low.svg'])
  }

  return (
    <div className="consign-page-container">
      {/* Header Banner */}
      <section className="consign-hero-card">
        <span className="consign-tag-badge">Layanan Resmi Titip Jual</span>
        <h1 className="consign-hero-heading">Titip Jual Sepatu Koleksi Anda dengan Aman &amp; Cepat</h1>
        <p className="consign-hero-sub">
          Punya sneakers authentic yang ingin dijual? Titipkan di platform ZedConsign.
          Kami menangani kurasi autentikasi fisik, foto profesional, katalog digital terverifikasi, dan pengiriman aman.
        </p>
      </section>

      {/* 4 Steps Grid */}
      <section className="consign-steps-section">
        <h2 className="consign-section-title">4 Langkah Mudah Titip Jual</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Upload Foto &amp; Data</h3>
            <p>
              Unggah foto sepatu dari kamera HP/komputer, cantumkan spesifikasi, ukuran, dan harga yang Anda inginkan.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Legit Check &amp; Kurasi</h3>
            <p>
              Tim kurator memeriksa keaslian material, box, insole, jahitan, dan nomor seri secara mendalam.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Tayang di Katalog PWA</h3>
            <p>
              Sepatu Anda langsung tayang di katalog ZedConsign dan dapat ditemukan calon pembeli bahkan secara offline.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Terjual &amp; Dana Cair</h3>
            <p>
              Setelah unit dikonfirmasi sampai di tangan pembeli, dana hasil penjualan otomatis dicairkan ke rekening Anda.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Calculator */}
      <section className="calculator-card">
        <h3 className="calc-title">Kalkulator Estimasi Hasil Titip Jual</h3>
        <p className="calc-sub">
          Biaya jasa titip jual ZedConsign flat 5% dari harga jual. Transparan tanpa potongan tersembunyi.
        </p>

        <div className="form-group">
          <label className="form-label">Masukkan Rencana Harga Jual Sepatu (Rp):</label>
          <input
            type="number"
            step="50000"
            className="form-input"
            value={askingPrice}
            onChange={(e) => setAskingPrice(Math.max(0, Number(e.target.value)))}
          />
        </div>

        <div className="calc-result-box">
          <div className="calc-row">
            <span className="calc-lbl">Harga Listing di Katalog:</span>
            <strong>{formatRupiah(askingPrice)}</strong>
          </div>
          <div className="calc-row">
            <span className="calc-lbl">Biaya Jasa ZedConsign (5%):</span>
            <span style={{ color: '#ef4444' }}>- {formatRupiah(feeAmount)}</span>
          </div>
          <div className="calc-row-total">
            <span>Estimasi Dana Bersih yang Diterima:</span>
            <strong className="calc-total-val">{formatRupiah(payoutAmount)}</strong>
          </div>
        </div>
      </section>

      {/* Formulir Pengajuan Titip Jual Langsung (With Photo Upload) */}
      <section className="sell-form-card" id="form-titip-jual">
        <div className="sell-form-header">
          <span className="sell-badge-icon">🏷️</span>
          <div>
            <h2 className="sell-form-title">Formulir Titip Jual Sepatu</h2>
            <p className="sell-form-desc">
              Lengkapi informasi sepatu dan unggah foto asli unit Anda untuk langsung ditampilkan di katalog.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="auth-error-banner" style={{ marginBottom: '16px' }}>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="sell-success-banner">
            <div className="success-icon-check">✓</div>
            <div style={{ flex: 1 }}>
              <strong>Pengajuan Berhasil!</strong>
              <p>{successMessage}</p>
            </div>
            {onNavigateCatalog && (
              <button
                type="button"
                className="btn-view-in-catalog"
                onClick={onNavigateCatalog}
              >
                Lihat di Katalog
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSellSubmit} className="sell-submission-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Nama / Model Sepatu *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Contoh: Air Jordan 4 Retro Military Black"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Brand / Merk *</label>
              <select
                className="form-select"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              >
                {BRANDS.filter((b) => b !== 'Semua').map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="Asics">Asics</option>
                <option value="Salomon">Salomon</option>
                <option value="Other">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Kategori *</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.filter((c) => c !== 'Semua').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ukuran / Size (US / EU) *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Contoh: US 9.5 / EU 43"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kondisi Sepatu *</label>
              <select
                className="form-select"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
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
              <label className="form-label">Rencana Harga Jual (Rp) *</label>
              <input
                type="number"
                required
                className="form-input"
                placeholder="Contoh: 3200000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nama Anda / Kontak Consignor</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Shiddiq / 081234567890"
                value={consignor}
                onChange={(e) => setConsignor(e.target.value)}
              />
            </div>
          </div>

          {/* Image Uploader Component */}
          <div className="form-group" style={{ margin: '16px 0' }}>
            <ImageUploader
              images={images}
              maxPhotos={8}
              onChange={(newImgs) => setImages(newImgs)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi &amp; Kelengkapan Sepatu</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Ceritakan detail kelengkapan box, ekstra laces, struk pembelian, atau catatan kondisi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="sell-form-submit-row">
            <button type="submit" className="btn-submit-consign">
              🚀 Kirim Pengajuan Titip Jual (Tayang ke Katalog)
            </button>
            {onNavigateManage && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onNavigateManage}
              >
                Buka Kelola Inventaris Sepatu (CRUD)
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}

export default ConsignInfo
