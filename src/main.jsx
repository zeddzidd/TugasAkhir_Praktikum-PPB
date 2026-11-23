import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Di local network / dev mode: unregister service worker agar pengujian di HP via Wi-Fi selalu 100% real-time
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isProd = window.location.hostname.includes('vercel.app')
  if (!isProd) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister()
      }
    }).catch(() => {})
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name)
        }
      }).catch(() => {})
    }
  } else {
    // Pada production Vercel: update segera saat ada rilis baru
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateSW(true)
      },
      onOfflineReady() {
        console.log('ZedConsign PWA siap offline')
      },
    })
    navigator.serviceWorker.ready.then((reg) => {
      reg.update()
    }).catch(() => {})
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
