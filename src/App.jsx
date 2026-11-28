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
import { DEFAULT_SHOES, isDummyShoe } from './data/shoes.js'
import { fetchOrdersFromSupabase } from './lib/orders.js'
import {
  getCurrentSession,
  fetchShoesFromSupabase,
  syncShoeToSupabase,
  deleteShoeFromSupabase,
  syncAllShoesToSupabase,
  signInUser,
  signUpUser,
  isAdminUser,
} from './lib/supabase.js'
import './App.css'

const STORAGE_KEY = 'zedconsign_shoes_catalog_v3'
const TAB_STORAGE_KEY = 'zedconsign_active_tab'

function App() {
  const [tab, setTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem(TAB_STORAGE_KEY) || localStorage.getItem(TAB_STORAGE_KEY)
      if (saved && ['catalog', 'consign', 'manage', 'orders', 'profile'].includes(saved)) {
        return saved
      }
    } catch {}
    return 'catalog'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubNav, setSelectedSubNav] = useState('all')
  const [authModalMode, setAuthModalMode] = useState(null) // 'login' | 'register' | null
  const [pendingTabAfterAuth, setPendingTabAfterAuth] = useState(null)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('zedconsign_current_session')
      const sess = raw ? JSON.parse(raw) : null
      return sess?.user || null
    } catch {
      return null
    }
  })

  // Load session on launch and keep synchronized with remote
  useEffect(() => {
    async function checkAuth() {
      const sess = await getCurrentSession()
      if (sess?.user) {
        setCurrentUser(sess.user)
        try {
          await fetchOrdersFromSupabase(sess.user)
        } catch {}
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
          // Bersihkan seluruh sepatu dummy, pertahankan hanya sepatu asli hasil upload
          const realOnly = parsed.filter((s) => !isDummyShoe(s))
          if (realOnly.length > 0) {
            return realOnly.map((s) => {
              const primaryImg = (Array.isArray(s.images) && s.images[0]) || s.image || ''
              return {
                ...s,
                image: primaryImg,
                images: (Array.isArray(s.images) && s.images.length > 0)
                  ? s.images
                  : [primaryImg],
                authStatus: s.authStatus || 'verified',
              }
            })
          }
        }
      }
    } catch (e) {
      console.warn('Gagal memuat katalog dari localStorage:', e)
    }
    return []
  })

  // Synchronize with remote Supabase database on launch without dummy data
  useEffect(() => {
    async function loadShoesFromDb() {
      try {
        const remoteShoes = await fetchShoesFromSupabase()
        if (remoteShoes && remoteShoes.length > 0) {
          const cleanRemote = remoteShoes.filter((s) => !isDummyShoe(s))
          setShoes((prev) => {
            const remoteIds = new Set(cleanRemote.map((r) => r.id))
            // Pertahankan sepatu lokal yang baru diunggah dan bukan dummy
            const localOnly = prev.filter(
              (p) => !remoteIds.has(p.id) && !isDummyShoe(p)
            )
            return [...localOnly, ...cleanRemote]
          })
        }
      } catch (err) {
        console.warn('Supabase shoe sync error:', err)
      }
    }
    loadShoesFromDb()
  }, [])

  // Persist shoes to localStorage safely (with quota guard for large base64 uploads)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shoes))
    } catch (e) {
      console.warn('LocalStorage kuota penuh, mencoba menyimpan versi teroptimasi:', e)
      try {
        const optimized = shoes.map((s) => ({
          ...s,
          images: Array.isArray(s.images) && s.images.length > 4 ? s.images.slice(0, 4) : s.images,
        }))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(optimized))
      } catch (err2) {
        console.error('Gagal menyimpan ke localStorage:', err2)
      }
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
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, newTab)
      localStorage.setItem(TAB_STORAGE_KEY, newTab)
    } catch {}
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
    setShoes([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error(e)
    }
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
            onNavigateConsign={() => handleSelectTab('consign')}
            onNavigateCatalog={() => handleSelectTab('catalog')}
            onSwitchToAdmin={async () => {
              try {
                const res = await signInUser({
                  email: 'shiddiqyazidn29@gmail.com',
                  password: 'password123',
                }).catch(async () => {
                  return await signUpUser({
                    email: 'shiddiqyazidn29@gmail.com',
                    password: 'password123',
                    fullName: 'Shiddiq Yazid Nurhakim',
                    phone: '081234567890',
                  })
                })
                setCurrentUser(res.user)
              } catch (e) {
                console.error('Failed to switch to admin:', e)
              }
            }}
          />
        )}
        {tab === 'consign' && (
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
