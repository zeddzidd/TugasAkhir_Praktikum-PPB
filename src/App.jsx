import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import SupportWidget from './components/SupportWidget.jsx'
import AuthModal from './components/AuthModal.jsx'
import Catalog from './pages/Catalog.jsx'
import ManageShoes from './pages/ManageShoes.jsx'
import ConsignInfo from './pages/ConsignInfo.jsx'
import Orders from './pages/Orders.jsx'
import Profile from './pages/Profile.jsx'
import { DEFAULT_SHOES } from './data/shoes.js'
import {
  getCurrentSession,
  fetchShoesFromSupabase,
  syncShoeToSupabase,
  deleteShoeFromSupabase,
  syncAllShoesToSupabase,
} from './lib/supabase.js'
import './App.css'

const STORAGE_KEY = 'zedconsign_shoes_catalog_v3'

function App() {
  const [tab, setTab] = useState('catalog')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubNav, setSelectedSubNav] = useState('all')
  const [authModalMode, setAuthModalMode] = useState(null) // 'login' | 'register' | null
  const [pendingTabAfterAuth, setPendingTabAfterAuth] = useState(null)
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
          // Ensure all shoes have valid images array
          return parsed.map((s) => {
            const defaultMatch = DEFAULT_SHOES.find((d) => d.id === s.id)
            return {
              ...s,
              images: (Array.isArray(s.images) && s.images.length > 0)
                ? s.images
                : (defaultMatch?.images || (s.image ? [s.image] : ['/shoes/dunk-low.svg'])),
            }
          })
        }
      }
    } catch (e) {
      console.warn('Gagal memuat katalog dari localStorage, memuat default.', e)
    }
    return DEFAULT_SHOES
  })

  // Synchronize with remote Supabase database on launch
  useEffect(() => {
    async function loadShoesFromDb() {
      try {
        const remoteShoes = await fetchShoesFromSupabase()
        if (remoteShoes && remoteShoes.length > 0) {
          setShoes(remoteShoes)
        }
      } catch (err) {
        console.warn('Supabase shoe sync error:', err)
      }
    }
    loadShoesFromDb()
  }, [])

  // Persist shoes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shoes))
    } catch (e) {
      console.error('Gagal menyimpan ke localStorage:', e)
    }
  }, [shoes])

  // Strictly redirect away from consign if user is not logged in
  useEffect(() => {
    if (!currentUser && tab === 'consign') {
      setTab('catalog')
    }
  }, [currentUser, tab])

  // Tab change with strict auth guard: Sell page cannot be opened without login
  const handleSelectTab = (newTab) => {
    if (newTab === 'consign' && !currentUser) {
      setPendingTabAfterAuth('consign')
      setAuthModalMode('login')
      return // Tetap di tab sekarang, halaman sell sama sekali tidak dibuka
    }
    setTab(newTab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // CRUD Actions connected to both React State & Supabase
  const handleAddShoe = (newShoe) => {
    setShoes((prev) => [newShoe, ...prev])
    syncShoeToSupabase(newShoe)
  }

  const handleUpdateShoe = (updatedShoe) => {
    setShoes((prev) =>
      prev.map((item) => (item.id === updatedShoe.id ? updatedShoe : item))
    )
    syncShoeToSupabase(updatedShoe)
  }

  const handleDeleteShoe = (shoeId) => {
    setShoes((prev) => prev.filter((item) => item.id !== shoeId))
    deleteShoeFromSupabase(shoeId)
  }

  const handleResetDefault = () => {
    setShoes(DEFAULT_SHOES)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SHOES))
    } catch (e) {
      console.error(e)
    }
    syncAllShoesToSupabase(DEFAULT_SHOES)
  }

  const handleManualSyncSupabase = async () => {
    return await syncAllShoesToSupabase(shoes)
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
            onNavigateConsign={() => handleSelectTab('consign')}
            currentUser={currentUser}
            onOpenAuth={(mode) => setAuthModalMode(mode || 'login')}
            onAddShoe={handleAddShoe}
          />
        )}
        {tab === 'manage' && (
          <ManageShoes
            shoes={shoes}
            onAddShoe={handleAddShoe}
            onUpdateShoe={handleUpdateShoe}
            onDeleteShoe={handleDeleteShoe}
            onResetDefault={handleResetDefault}
            onSyncSupabase={handleManualSyncSupabase}
            currentUser={currentUser}
            onOpenAuth={(mode) => setAuthModalMode(mode || 'login')}
          />
        )}
        {tab === 'consign' && currentUser && (
          <ConsignInfo
            onAddShoe={handleAddShoe}
            onNavigateCatalog={() => handleSelectTab('catalog')}
            onNavigateManage={() => handleSelectTab('manage')}
            currentUser={currentUser}
            onOpenAuth={(mode) => setAuthModalMode(mode || 'login')}
          />
        )}
        {tab === 'orders' && (
          <Orders
            onNavigateCatalog={() => handleSelectTab('catalog')}
            currentUser={currentUser}
            onOpenAuth={(mode) => setAuthModalMode(mode || 'login')}
          />
        )}
        {tab === 'profile' && (
          <Profile
            onNavigateManage={() => handleSelectTab('manage')}
            onAuthChange={(user) => setCurrentUser(user)}
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
          onClose={() => {
            setAuthModalMode(null)
            setPendingTabAfterAuth(null)
          }}
          onAuthSuccess={(sess) => {
            if (sess?.user) {
              setCurrentUser(sess.user)
              if (pendingTabAfterAuth) {
                setTab(pendingTabAfterAuth)
                setPendingTabAfterAuth(null)
              }
            }
          }}
        />
      )}
    </div>
  )
}

export default App
