import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import SupportWidget from './components/SupportWidget.jsx'
import AuthModal from './components/AuthModal.jsx'
import Catalog from './pages/Catalog.jsx'
import ManageShoes from './pages/ManageShoes.jsx'
import ConsignInfo from './pages/ConsignInfo.jsx'
import Profile from './pages/Profile.jsx'
import { DEFAULT_SHOES } from './data/shoes.js'
import { getCurrentSession } from './lib/supabase.js'
import './App.css'

const STORAGE_KEY = 'zedconsign_shoes_catalog_v3'

function App() {
  const [tab, setTab] = useState('catalog')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubNav, setSelectedSubNav] = useState('all')
  const [authModalMode, setAuthModalMode] = useState(null) // 'login' | 'register' | null
  const [currentUser, setCurrentUser] = useState(null)

  // Load session on launch
  useEffect(() => {
    async function checkAuth() {
      const sess = await getCurrentSession()
      if (sess?.user) {
        setCurrentUser(sess.user)
      }
    }
    checkAuth()
  }, [])

  const [shoes, setShoes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasGoadome = parsed.some((s) => s.id === 'shoe-0')
          if (!hasGoadome) {
            return DEFAULT_SHOES
          }
          return parsed
        }
      }
    } catch (e) {
      console.warn('Gagal memuat katalog dari localStorage, memuat default.', e)
    }
    return DEFAULT_SHOES
  })

  // Persist shoes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shoes))
    } catch (e) {
      console.error('Gagal menyimpan ke localStorage:', e)
    }
  }, [shoes])

  // Scroll to top on tab change
  const handleSelectTab = (newTab) => {
    setTab(newTab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // CRUD Actions
  const handleAddShoe = (newShoe) => {
    setShoes((prev) => [newShoe, ...prev])
  }

  const handleUpdateShoe = (updatedShoe) => {
    setShoes((prev) =>
      prev.map((item) => (item.id === updatedShoe.id ? updatedShoe : item))
    )
  }

  const handleDeleteShoe = (shoeId) => {
    setShoes((prev) => prev.filter((item) => item.id !== shoeId))
  }

  const handleResetDefault = () => {
    setShoes(DEFAULT_SHOES)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SHOES))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="app-shell">
      <OfflineBanner />
      
      <Header
        activeTab={tab}
        onSelectTab={handleSelectTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSubNav={selectedSubNav}
        onSelectSubNav={(nav) => setSelectedSubNav(nav)}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
        currentUser={currentUser}
      />

      <main className="main-content">
        {tab === 'catalog' && (
          <Catalog
            shoes={shoes}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedSubNav={selectedSubNav}
            onSelectSubNav={setSelectedSubNav}
            onNavigateManage={() => handleSelectTab('manage')}
          />
        )}
        {tab === 'manage' && (
          <ManageShoes
            shoes={shoes}
            onAddShoe={handleAddShoe}
            onUpdateShoe={handleUpdateShoe}
            onDeleteShoe={handleDeleteShoe}
            onResetDefault={handleResetDefault}
          />
        )}
        {tab === 'consign' && (
          <ConsignInfo
            onAddShoe={handleAddShoe}
            onNavigateCatalog={() => handleSelectTab('catalog')}
            onNavigateManage={() => handleSelectTab('manage')}
          />
        )}
        {tab === 'profile' && (
          <Profile
            onNavigateManage={() => handleSelectTab('manage')}
          />
        )}
      </main>

      <Footer />

      {/* Floating Support Desk matching Kick Avenue widget in screenshot */}
      <SupportWidget onNavigateConsign={() => handleSelectTab('consign')} />

      {/* Login / Register Dialog */}
      {authModalMode && (
        <AuthModal
          mode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onAuthSuccess={(sess) => {
            if (sess?.user) setCurrentUser(sess.user)
          }}
        />
      )}
    </div>
  )
}

export default App
