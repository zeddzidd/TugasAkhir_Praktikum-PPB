import { useState, useRef } from 'react'

const PRESET_IMAGES = [
  { label: 'Air Max Goadome Foam', value: '/shoes/goadome-foam.svg' },
  { label: 'Air Jordan 1 Lost & Found', value: '/shoes/jordan-retro.svg' },
  { label: 'Nike Dunk Low Panda', value: '/shoes/dunk-low.svg' },
  { label: 'Yeezy Boost 350 Beluga', value: '/shoes/yeezy-boost.svg' },
  { label: 'New Balance 990v5', value: '/shoes/new-balance.svg' },
  { label: 'Adidas Samba OG', value: '/shoes/samba-og.svg' },
  { label: 'Travis Scott AJ1 Low', value: '/shoes/travis-scott.svg' },
]

function ImageUploader({ value, onChange }) {
  const [tab, setTab] = useState(value && value.startsWith('data:image') ? 'upload' : 'upload')
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:image') && !value.startsWith('/shoes/') ? value : '')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)

  // Compress & convert file to Base64
  const processImageFile = (file) => {
    if (!file) return
    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Resize if too large to ensure fast localStorage & Supabase persistence
        const maxDim = 900
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

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
        onChange(compressedDataUrl)
        setIsProcessing(false)
      }
      img.onerror = () => {
        onChange(e.target.result)
        setIsProcessing(false)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      processImageFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleClear = () => {
    onChange('/shoes/dunk-low.svg')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const isCustomUpload = value && value.startsWith('data:image')

  return (
    <div className="image-uploader-card">
      {/* Upload Mode Selector */}
      <div className="image-source-tabs">
        <button
          type="button"
          className={`image-tab-btn ${tab === 'upload' ? 'active' : ''}`}
          onClick={() => setTab('upload')}
        >
          📷 Upload Berkas / Kamera
        </button>
        <button
          type="button"
          className={`image-tab-btn ${tab === 'preset' ? 'active' : ''}`}
          onClick={() => setTab('preset')}
        >
          🎨 Pilihan Ilustrasi
        </button>
        <button
          type="button"
          className={`image-tab-btn ${tab === 'url' ? 'active' : ''}`}
          onClick={() => setTab('url')}
        >
          🔗 URL Gambar
        </button>
      </div>

      {/* Mode 1: File Upload / Camera */}
      {tab === 'upload' && (
        <div className="upload-dropzone-wrap">
          <input
            ref={fileInputRef}
            type="file"
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="dropzone-main-text">
              <strong>Klik untuk memilih foto</strong> atau seret gambar ke sini
            </p>
            <span className="dropzone-sub-text">
              Mendukung PNG, JPG, JPEG, WEBP (Bisa langsung foto via Kamera HP)
            </span>

            {isProcessing && (
              <div className="dropzone-loading">
                <span>Memproses &amp; mengompres gambar...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Preset Local Illustration */}
      {tab === 'preset' && (
        <div className="preset-images-grid">
          {PRESET_IMAGES.map((img) => (
            <button
              key={img.value}
              type="button"
              className={`preset-thumb-btn ${value === img.value ? 'selected' : ''}`}
              onClick={() => onChange(img.value)}
            >
              <img src={img.value} alt={img.label} className="preset-thumb-img" />
              <span className="preset-thumb-label">{img.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mode 3: Image URL */}
      {tab === 'url' && (
        <div className="url-input-wrap">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/... atau URL foto langsung"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => {
                if (urlInput.trim()) {
                  onChange(urlInput.trim())
                }
              }}
            >
              Terapkan
            </button>
          </div>
        </div>
      )}

      {/* Live Preview Box */}
      {value && (
        <div className="image-live-preview-box">
          <div className="preview-header">
            <span className="preview-label">
              {isCustomUpload ? '✅ Foto Kustom Terpasang' : 'Pratinjau Gambar Sepatu'}
            </span>
            <button
              type="button"
              className="btn-remove-image"
              onClick={handleClear}
              title="Reset ke gambar bawaan"
            >
              &times; Reset Gambar
            </button>
          </div>

          <div className="preview-thumbnail-wrap">
            <img
              src={value}
              alt="Pratinjau Sepatu"
              className="preview-thumbnail-img"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/shoes/dunk-low.svg'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUploader
