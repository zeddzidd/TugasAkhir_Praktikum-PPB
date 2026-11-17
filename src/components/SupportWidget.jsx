import { useState } from 'react'

function SupportWidget({ onNavigateConsign }) {
  const [tooltipVisible, setTooltipVisible] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="support-floating-container">
        {/* Tooltip matching screenshot: "Have questions? We're here to help." */}
        {tooltipVisible && !isOpen && (
          <div className="support-tooltip">
            <button
              type="button"
              className="tooltip-close-btn"
              onClick={(e) => {
                e.stopPropagation()
                setTooltipVisible(false)
              }}
              aria-label="Tutup pesan"
            >
              &times;
            </button>
            <span className="tooltip-text">Have questions? We&apos;re here to help.</span>
          </div>
        )}

        {/* Green Circle Chat Button */}
        <button
          type="button"
          className="support-circle-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Bantuan & Konsultasi Titip Jual"
          aria-label="Chat Support"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      </div>

      {/* Quick Help Dialog Modal */}
      {isOpen && (
        <div className="support-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="support-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="support-modal-header">
              <div className="support-header-brand">
                <span className="support-badge-dot"></span>
                <strong>ZedConsign Support Desk</strong>
              </div>
              <button
                type="button"
                className="support-close-btn"
                onClick={() => setIsOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="support-modal-body">
              <p className="support-intro-text">
                Halo! Selamat datang di <strong>ZedConsign</strong>. Ada yang bisa kami bantu seputar katalog, autentikasi sneakers, atau layanan titip jual?
              </p>

              <div className="support-actions-list">
                <button
                  type="button"
                  className="support-action-item"
                  onClick={() => {
                    setIsOpen(false)
                    if (onNavigateConsign) onNavigateConsign()
                  }}
                >
                  <span className="action-emoji">🏷️</span>
                  <div>
                    <strong>Mau Titip Jual Sepatu (Consign)</strong>
                    <span>Hitung estimasi potongan fee 5% dan dana bersih</span>
                  </div>
                </button>

                <div className="support-action-item">
                  <span className="action-emoji">🛡️</span>
                  <div>
                    <strong>Jaminan 100% Autentik</strong>
                    <span>Semua unit lolos legit check kurator resmi sebelum dikirim</span>
                  </div>
                </div>

                <div className="support-action-item">
                  <span className="action-emoji">⚡</span>
                  <div>
                    <strong>Pengiriman Express 24 Jam</strong>
                    <span>Sepatu bertanda Express langsung diproses pada hari yang sama</span>
                  </div>
                </div>
              </div>

              <div className="support-chat-footer">
                <a
                  href="https://wa.me/?text=Halo%20ZedConsign,%20saya%20ingin%20bertanya%20seputar%20titip%20jual%20sepatu."
                  target="_blank"
                  rel="noreferrer"
                  className="support-btn-wa"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  Chat Customer Service (WhatsApp)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SupportWidget
