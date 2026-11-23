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
  // Normalize current images: Bersih dan kosong jika belum ada foto, tanpa cover bawaan
  const rawList = Array.isArray(images)
    ? images
    : Array.isArray(value)
    ? value
    : typeof value === 'string' && value
    ? [value]
    : []
  const currentImages = rawList.filter((img) => img && !img.includes('dunk-low.svg'))

  const [tab, setTab] = useState('upload')
  const [urlInput, setUrlInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [statusNotice, setStatusNotice] = useState('')
  const fileInputRef = useRef(null)

  const showNotice = (msg) => {
    setStatusNotice(msg)
    setTimeout(() => setStatusNotice(''), 4000)
  }

  // Compress & convert file using URL.createObjectURL (sangat cepat, hemat RAM di HP, no memory leak)
  const compressFile = (file) => {
    return new Promise((resolve) => {
      let objectUrl = null
      try {
        objectUrl = URL.createObjectURL(file)
      } catch {
        objectUrl = null
      }

      // Timeout pengaman jika file gagal didecode di HP
      const timer = setTimeout(() => {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        resolve(null)
      }, 7000)

      const img = new Image()
      img.onload = () => {
        clearTimeout(timer)
        try {
          const maxDim = 600 // Resolusi ideal: jernih di layar HP dan hemat kuota/localStorage
          let width = img.naturalWidth || img.width
          let height = img.naturalHeight || img.height

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
          canvas.width = Math.max(1, width)
          canvas.height = Math.max(1, height)
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            if (objectUrl) URL.revokeObjectURL(objectUrl)
            return resolve(null)
          }

          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          const compressed = canvas.toDataURL('image/jpeg', 0.74)
          if (objectUrl) URL.revokeObjectURL(objectUrl)
          resolve(compressed)
        } catch (canvasErr) {
          console.warn('Canvas error:', canvasErr)
          if (objectUrl) URL.revokeObjectURL(objectUrl)
          resolve(null)
        }
      }

      img.onerror = () => {
        clearTimeout(timer)
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        // Fallback FileReader jika createObjectURL terkendala
        const reader = new FileReader()
        reader.onload = (e) => {
          const raw = e.target?.result
          resolve(typeof raw === 'string' && raw.length < 500000 ? raw : null)
        }
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(file)
      }

      if (objectUrl) {
        img.src = objectUrl
      } else {
        const reader = new FileReader()
        reader.onload = (e) => {
          img.src = e.target.result
        }
        reader.readAsDataURL(file)
      }
    })
  }

  // Handle multiple files from input or drop simultaneously
  const handleFiles = async (filesList) => {
    if (!filesList || filesList.length === 0) return

    // Bersihkan placeholder apapun agar tidak ada cover lain yang menahan slot
    const baseImages = currentImages.filter((img) => img && !img.includes('dunk-low.svg'))

    const availableSlots = maxPhotos - baseImages.length
    if (availableSlots <= 0) {
      showNotice(`Maksimal ${maxPhotos} foto telah tercapai. Hapus beberapa foto untuk menambahkan yang baru.`)
      return
    }

    setIsProcessing(true)
    setProcessingStatus('Menyiapkan foto dari HP...')

    // Validasi file fleksibel untuk HP
    const isImageFile = (f) => {
      if (f.type && (f.type.startsWith('image/') || f.type.includes('heic') || f.type.includes('heif'))) return true
      if (f.name && f.name.match(/\.(jpe?g|png|webp|heic|heif|gif|svg|bmp)$/i)) return true
      if (!f.type && f.size > 0 && f.size < 35 * 1024 * 1024) return true // iOS Gallery camera pick
      return false
    }

    const validFiles = Array.from(filesList).filter(isImageFile)

    if (validFiles.length === 0) {
      setIsProcessing(false)
      setProcessingStatus('')
      showNotice('Format berkas tidak terbaca. Harap pilih foto PNG, JPG, JPEG, atau WEBP.')
      return
    }

    const filesToProcess = validFiles.slice(0, availableSlots)
    if (validFiles.length > availableSlots) {
      showNotice(`Memproses ${availableSlots} foto (maksimal ${maxPhotos} foto tercapai).`)
    }

    try {
      const validResults = []
      for (let i = 0; i < filesToProcess.length; i++) {
        setProcessingStatus(`Memproses foto ${i + 1} dari ${filesToProcess.length}...`)
        const res = await compressFile(filesToProcess[i])
        if (res) {
          validResults.push(res)
        }
      }

      if (validResults.length > 0) {
        const updated = [...baseImages, ...validResults]
        onChange(updated, updated[0] || '')
        showNotice(`✓ Berhasil menambahkan ${validResults.length} foto sekaligus!`)
      } else {
        showNotice('Gagal memproses foto. Silakan coba pilih foto lain.')
      }
    } catch (err) {
      console.error('Error proses foto:', err)
      showNotice('Gagal mengunggah foto.')
    } finally {
      setIsProcessing(false)
      setProcessingStatus('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Instant fill 8 preset angles
  const handleFillAllPresets = () => {
    const eightAngles = PRESET_IMAGES.slice(0, maxPhotos).map((p) => p.value)
    onChange(eightAngles, eightAngles[0])
    showNotice(`✓ Berhasil memuat ${eightAngles.length} foto sudut sekaligus secara instan!`)
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

  // Reset all (dikosongkan total tanpa cover tiruan)
  const handleResetAll = () => {
    onChange([], '')
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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700' }}
            onClick={handleFillAllPresets}
            title="Muat 8 foto sudut preset sekaligus secara instan"
          >
            ⚡ Isi Cepat 8 Foto
          </button>
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
            accept="image/*, image/jpeg, image/jpg, image/png, image/webp, image/heic, image/heif"
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
              <strong>Pilih Banyak Foto Sekaligus (Hingga {maxPhotos} Foto)</strong>
            </p>
            <span className="dropzone-sub-text">
              Pilih langsung banyak foto dari Galeri HP Anda sekaligus atau jepret langsung via Kamera
            </span>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '10px 18px', fontSize: '13px', borderRadius: '8px' }}
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                📁 Pilih Banyak Foto dari Galeri HP
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '10px 18px', fontSize: '13px', borderRadius: '8px' }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleFillAllPresets()
                }}
              >
                ⚡ Isi Cepat 8 Sudut Preset
              </button>
            </div>

            {isProcessing && (
              <div
                className="dropzone-loading"
                style={{
                  marginTop: '16px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  color: '#fff',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '700' }}>
                  ⏳ {processingStatus || 'Sedang mengompresi & memproses foto...'}
                </div>
                <small style={{ fontSize: '11px', opacity: 0.85, display: 'block', marginTop: '2px' }}>
                  Mohon tunggu beberapa detik, foto disesuaikan otomatis agar tidak berat di HP.
                </small>
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
            Daftar Foto Sepatu yang Dipilih ({currentImages.length} / {maxPhotos} Foto)
          </span>
          {currentImages.length > 0 && (
            <span className="iu-gallery-hint">
              Foto pertama otomatis menjadi <strong>Foto Utama (Cover)</strong>
            </span>
          )}
        </div>

        {currentImages.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              color: 'var(--text-dim)',
              background: '#f8fafc',
              marginTop: '12px',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📷</div>
            <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '15px', marginBottom: '4px' }}>
              Belum Ada Foto Sepatu yang Dipilih (Kosong)
            </strong>
            <p style={{ fontSize: '13px', margin: '0 auto 16px', maxWidth: '380px', lineHeight: '1.5' }}>
              Tidak ada foto cover tiruan. Silakan pilih foto asli sepatu Anda dari galeri HP untuk mulai mengisi galeri.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '13px' }}
              onClick={() => fileInputRef.current?.click()}
            >
              + Pilih Foto dari Galeri HP
            </button>
          </div>
        ) : (
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
                      e.target.style.opacity = '0.5'
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
        )}
      </div>
    </div>
  )
}

export default ImageUploader
