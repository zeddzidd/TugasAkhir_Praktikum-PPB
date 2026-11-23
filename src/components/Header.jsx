import { useState, useEffect } from 'react'
import { SUB_NAV_ITEMS } from '../data/shoes.js'

function Header({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  selectedSubNav,
  onSelectSubNav,
  onOpenAuth,
  currentUser,
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)

  const initials = currentUser
    ? (currentUser.fullName || currentUser.email || 'US')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setCanInstall(false)
    }
    setDeferredPrompt(null)
  }

  return (
    <>
      <header className="app-header">
        {/* Top Bar */}
        <div className="header-top-row">
          {/* Logo in Kick Avenue font style: ZED CONSIGN */}
          <div className="brand-wrapper" onClick={() => onSelectTab('catalog')} title="Kembali ke Beranda">
            <span className="brand-logo-text">ZED CONSIGN</span>
          </div>

          {/* Search bar matching screenshot */}
          <div className="header-search-wrap">
            <svg
              className="header-search-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="header-search-input"
              placeholder="Search 1,000,000+ authentic items"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value)
                if (activeTab !== 'catalog') onSelectTab('catalog')
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="header-search-clear"
                onClick={() => onSearchChange('')}
                title="Hapus pencarian"
              >
                &times;
              </button>
            )}
          </div>

          {/* Right Navigation & Auth */}
          <nav className="desktop-header-nav">
            <button
              type="button"
              className={`header-nav-link ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => onSelectTab('catalog')}
            >
              Home
            </button>

            <button
              type="button"
              className={`header-nav-link ${activeTab === 'catalog' && selectedSubNav === 'Sneakers' ? 'active' : ''}`}
              onClick={() => {
                onSelectTab('catalog')
                onSelectSubNav('Sneakers')
              }}
            >
              Market
            </button>

            <button
              type="button"
              className={`header-nav-link ${activeTab === 'consign' ? 'active' : ''}`}
              onClick={() => onSelectTab('consign')}
            >
              Sell
            </button>

            <button
              type="button"
              className={`header-nav-link ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => onSelectTab('manage')}
              title="Kelola Data Sepatu"
            >
              Kelola
            </button>

            <button
              type="button"
              className={`header-nav-link ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => onSelectTab('orders')}
              title="Daftar Pesanan & Resi Pengiriman"
            >
              Pesanan
            </button>

            <button
              type="button"
              className={`header-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => onSelectTab('profile')}
            >
              Profile
            </button>

            {currentUser ? (
              <div
                className="header-user-badge"
                onClick={() => onSelectTab('profile')}
                title="Buka Profil Pengguna"
              >
                <div className="header-avatar-circle">{initials}</div>
                <span className="header-username">
                  {currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'Profil'}
                </span>
              </div>
            ) : (
              <div className="header-auth-group">
                <button
                  type="button"
                  className="header-btn-login"
                  onClick={() => onOpenAuth('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="header-btn-register"
                  onClick={() => onOpenAuth('register')}
                >
                  Register
                </button>
              </div>
            )}

            {canInstall && (
              <button
                type="button"
                className="pwa-install-pill"
                onClick={handleInstallClick}
                title="Install ZedConsign PWA"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Install
              </button>
            )}
          </nav>

          {/* Mobile Auth Actions (visible when desktop nav is hidden < 900px) */}
          <div className="mobile-header-auth-group">
            {currentUser ? (
              <div
                className="header-avatar-circle"
                onClick={() => onSelectTab('profile')}
                title="Buka Profil Pengguna"
              >
                {initials}
              </div>
            ) : (
              <div className="mobile-auth-pills">
                <button
                  type="button"
                  className="mobile-btn-login-text"
                  onClick={() => onOpenAuth('login')}
                  title="Masuk ke Akun"
                >
                  Masuk
                </button>
                <button
                  type="button"
                  className="mobile-btn-register-pill"
                  onClick={() => onOpenAuth('register')}
                  title="Daftar Akun Baru"
                >
                  Daftar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub-Navigation Strip (Redemption Center, Express Shipping ⚡, Sneakers, etc.) */}
        <div className="header-subnav-strip">
          <div className="subnav-scroll-container">
            {SUB_NAV_ITEMS.map((item) => {
              const isSelected = selectedSubNav === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`subnav-pill ${isSelected ? 'active' : ''} ${item.id === 'express' ? 'express-pill' : ''}`}
                  onClick={() => {
                    onSelectSubNav(item.id)
                    if (activeTab !== 'catalog') onSelectTab('catalog')
                  }}
                >
                  {item.label}
                  {item.icon && <span className="bolt-icon">{item.icon}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation for PWA (5 Halaman Utama: Home, Kelola, Sell, Pesanan, Profile) */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={`mobile-nav-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => onSelectTab('catalog')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => onSelectTab('manage')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span>Kelola</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${activeTab === 'consign' ? 'active' : ''}`}
          onClick={() => onSelectTab('consign')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          <span>Sell</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => onSelectTab('orders')}
          title="Daftar Pesanan & Resi"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span>Pesanan</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => onSelectTab('profile')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </button>
      </nav>
    </>
  )
}

export default Header
