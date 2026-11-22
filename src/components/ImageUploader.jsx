import { useState, useRef } from 'react'

const PRESET_IMAGES = [
  { label: 'Air Max Goadome Foam', value: '/shoes/goadome-foam.svg' },
  { label: 'Nike Shox Z Calistra', value: '/shoes/shox-calistra.svg' },
  { label: 'Air Jordan 1 Lost & Found', value: '/shoes/jordan-retro.svg' },
  { label: 'Nike Dunk Low Panda', value: '/shoes/dunk-low.svg' },
  { label: 'Yeezy Boost 350 Beluga', value: '/shoes/yeezy-boost.svg' },
  { label: 'New Balance 990v5', value: '/shoes/new-balance.svg' },
  { label: 'Adidas Samba OG', value: '/shoes/samba-og.svg' },
  { label: 'Travis Scott AJ1 Low', value: '/shoes/travis-scott.svg' },
]

const PHOTO_SUGGESTIONS = [
  '1. Tampak Samping Luar (Lateral)',
  '2. Tampak Samping Dalam (Medial)',
  '3. Tampak Depan (Toe Box)',
  '4. Tampak Belakang (Heel & Logo)',
  '5. Sol Bawah (Outsole)',
  '6. Insole & Tag Ukuran',
  '7. Detail Jahitan / Tekstur',
  '8. Box & Kelengkapan Ekstra',
]

function ImageUploader({ images = [], value, onChange, maxPhotos = 8 }) {
  // Normalize current images list from props
  const currentImages = Array.isArray(images) && images.length > 0
    ? images
    : Array.isArray(value) && value.length > 0
    ? value
    : typeof value === 'string' && value
    ? [value]
    : []

  const [tab, setTab] = useState('upload')
  const [urlInput, setUrlInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusNotice, setStatusNotice] = useState('')
  const fileInputRef = useRef(null)

  const showNotice = (msg) => {
    setStatusNotice(msg)
    setTimeout(() => setStatusNotice(''), 3500)
  }

  // Compress & convert a file to lightweight Base64
  const compressFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const maxDim = 850
          let width = img.width
          let height = img.height

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          const compressed = canvas.toDataURL('image/jpeg', 0.82)
          resolve(compressed)
        }
        img.onerror = () => resolve(e.target.result)
        img.src = e.target.result
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }

  // Handle multiple files from input or drop
  const handleFiles = async (filesList) => {
    if (!filesList || filesList.length === 0) return

    const availableSlots = maxPhotos - currentImages.length
    if (availableSlots <= 0) {
      showNotice(`Maksimal ${maxPhotos} foto telah tercapai. Hapus beberapa foto untuk menambahkan yang baru.`)
      return
    }

    setIsProcessing(true)
    const validFiles = Array.from(filesList).filter((f) => f.type.startsWith('image/'))

    if (validFiles.length === 0) {
      setIsProcessing(false)
      showNotice('Format berkas tidak didukung. Harap pilih gambar PNG, JPG, atau WEBP.')
      return
    }

    const filesToProcess = validFiles.slice(0, availableSlots)
    if (validFiles.length > availableSlots) {
      showNotice(`Hanya ${availableSlots} foto yang ditambahkan karena batas maksimal ${maxPhotos} foto.`)
    }

    try {
      const compressedResults = await Promise.all(filesToProcess.map((f) => compressFile(f)))
      const validResults = compressedResults.filter(Boolean)

      const updated = [...currentImages, ...validResults]
      onChange(updated, updated[0] || '')
    } catch (err) {
      console.error('Gagal memproses gambar:', err)
      showNotice('Gagal mengunggah foto. Silakan coba lagi.')
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e) => {
    handleFiles(e.target.files)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  // Add preset illustration
  const handleAddPreset = (presetUrl) => {
    if (currentImages.length >= maxPhotos) {
      showNotice(`Maksimal ${maxPhotos} foto telah tercapai.`)
      return
    }
    const updated = [...currentImages, presetUrl]
    onChange(updated, updated[0] || '')
  }

  // Add URL
  const handleAddUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return

    if (currentImages.length >= maxPhotos) {
      showNotice(`Maksimal ${maxPhotos} foto telah tercapai.`)
      return
    }

    const updated = [...currentImages, trimmed]
    onChange(updated, updated[0] || '')
    setUrlInput('')
  }

  // Remove photo at index
  const handleRemovePhoto = (indexToRemove) => {
    const updated = currentImages.filter((_, idx) => idx !== indexToRemove)
    onChange(updated, updated[0] || '')
  }

  // Move photo to cover (index 0)
  const handleMakeCover = (indexToCover) => {
    if (indexToCover === 0) return
    const target = currentImages[indexToCover]
    const remaining = currentImages.filter((_, idx) => idx !== indexToCover)
    const updated = [target, ...remaining]
    onChange(updated, target)
  }

  // Reset all
  const handleResetAll = () => {
    onChange(['/shoes/dunk-low.svg'], '/shoes/dunk-low.svg')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="image-uploader-card">
      {/* Header with Photo Counter & Progress */}
      <div className="iu-header-row">
        <div>
          <div className="iu-title-wrap">
            <span className="iu-title">Foto &amp; Galeri Detail Sepatu</span>
            <span className={`iu-counter-pill ${currentImages.length >= maxPhotos ? 'full' : ''}`}>
              📸 {currentImages.length} / {maxPhotos} Foto
            </span>
          </div>
          <p className="iu-subtitle">
            Unggah hingga <strong>maksimal {maxPhotos} foto</strong> dari berbagai sudut agar customer dapat memeriksa detail kondisi dan keaslian sepatu secara menyeluruh.
          </p>
        </div>

        {currentImages.length > 0 && (
          <button
            type="button"
            className="btn-iu-reset"
            onClick={handleResetAll}
            title="Reset ke gambar awal"
          >
            Reset Semua
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="iu-progress-bar-track">
        <div
          className="iu-progress-bar-fill"
          style={{ width: `${Math.min(100, (currentImages.length / maxPhotos) * 100)}%` }}
        />
      </div>

      {/* Recommended Angles Suggestion Guide */}
      <div className="iu-suggestions-box">
        <div className="iu-suggestions-header">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#006b52" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <strong>Rekomendasi 8 Sudut Foto Verifikasi (Kick Avenue Standard):</strong>
        </div>
        <div className="iu-suggestions-grid">
          {PHOTO_SUGGESTIONS.map((sug, i) => (
            <span
              key={i}
              className={`iu-sug-item ${i < currentImages.length ? 'checked' : ''}`}
            >
              {i < currentImages.length ? '✓ ' : '• '}{sug}
            </span>
          ))}
        </div>
      </div>

      {/* Notice Message */}
      {statusNotice && (
        <div className="iu-notice-banner">
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="image-source-tabs">
        <button
          type="button"
          className={`image-tab-btn ${tab === 'upload' ? 'active' : ''}`}
          onClick={() => setTab('upload')}
        >
          📷 Upload Berkas / Kamera (Bisa Banyak Foto)
        </button>
        <button
          type="button"
          className={`image-tab-btn ${tab === 'preset' ? 'active' : ''}`}
          onClick={() => setTab('preset')}
        >
          🎨 Pilihan Ilustrasi Siluet
        </button>
        <button
          type="button"
          className={`image-tab-btn ${tab === 'url' ? 'active' : ''}`}
          onClick={() => setTab('url')}
        >
          🔗 Tambah via URL Foto
        </button>
      </div>

      {/* Tab 1: Upload / Camera */}
      {tab === 'upload' && (
        <div className="upload-dropzone-wrap">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div
            className={`file-dropzone ${isProcessing ? 'processing' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="dropzone-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="dropzone-main-text">
              <strong>Klik untuk memilih 1 s.d {maxPhotos} foto</strong> atau seret berkas ke sini
            </p>
            <span className="dropzone-sub-text">
              Mendukung banyak foto sekaligus (PNG, JPG, JPEG, WEBP atau jepret langsung via Kamera HP)
            </span>

            {isProcessing && (
              <div className="dropzone-loading">
                <span>Sedang mengompresi &amp; memproses foto...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Preset Local Illustrations */}
      {tab === 'preset' && (
        <div className="preset-images-grid">
          {PRESET_IMAGES.map((img) => (
            <button
              key={img.value}
              type="button"
              className="preset-thumb-btn"
              onClick={() => handleAddPreset(img.value)}
              title="Klik untuk menambahkan ilustrasi ini ke galeri"
            >
              <img src={img.value} alt={img.label} className="preset-thumb-img" />
              <span className="preset-thumb-label">{img.label}</span>
              <span className="preset-add-badge">+ Tambah</span>
            </button>
          ))}
        </div>
      )}

      {/* Tab 3: URL */}
      {tab === 'url' && (
        <div className="url-input-wrap">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="url"
              className="form-input"
              placeholder="https://... tempel URL foto sepatu di sini"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddUrl()
                }
              }}
            />
            <button
              type="button"
              className="btn-primary"
              style={{ whiteSpace: 'nowrap' }}
              onClick={handleAddUrl}
            >
              + Tambah Foto
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Gallery Grid (Up to 8 Slots) */}
      <div className="iu-gallery-section">
        <div className="iu-gallery-title-bar">
          <span className="iu-gallery-title">
            Daftar Foto yang Siap Ditampilkan ({currentImages.length} Foto)
          </span>
          <span className="iu-gallery-hint">
            Foto pertama otomatis menjadi <strong>Foto Utama (Cover)</strong>
          </span>
        </div>

        <div className="iu-slots-grid">
          {currentImages.map((imgUri, index) => (
            <div key={`${index}-${imgUri.slice(0, 24)}`} className={`iu-slot-card ${index === 0 ? 'is-cover' : ''}`}>
              <div className="iu-slot-img-wrap">
                <img
                  src={imgUri}
                  alt={`Detail Foto ${index + 1}`}
                  className="iu-slot-img"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = '/shoes/dunk-low.svg'
                  }}
                />

                {index === 0 ? (
                  <span className="iu-badge-cover">⭐ Cover</span>
                ) : (
                  <span className="iu-badge-index">#{index + 1}</span>
                )}

                <button
                  type="button"
                  className="iu-btn-delete"
                  onClick={() => handleRemovePhoto(index)}
                  title="Hapus foto ini"
                  aria-label="Hapus foto"
                >
                  &times;
                </button>
              </div>

              <div className="iu-slot-footer">
                <span className="iu-slot-tag">
                  {PHOTO_SUGGESTIONS[index] ? PHOTO_SUGGESTIONS[index].replace(/^\d+\.\s*/, '') : `Sudut ${index + 1}`}
                </span>

                {index > 0 && (
                  <button
                    type="button"
                    className="iu-btn-make-cover"
                    onClick={() => handleMakeCover(index)}
                    title="Jadikan sebagai foto utama (cover)"
                  >
                    Jadikan Cover
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add More Slot (if under maxPhotos) */}
          {currentImages.length < maxPhotos && (
            <button
              type="button"
              className="iu-slot-add-btn"
              onClick={() => fileInputRef.current?.click()}
              title={`Tambah foto lagi (Tersisa ${maxPhotos - currentImages.length} slot)`}
            >
              <div className="iu-add-icon">+</div>
              <span className="iu-add-text">Tambah Foto</span>
              <span className="iu-add-sub">Slot {currentImages.length + 1} dari {maxPhotos}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageUploader
