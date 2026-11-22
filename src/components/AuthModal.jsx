import { useState, useEffect } from 'react'
import { signUpUser, signInUser } from '../lib/supabase.js'

function AuthModal({ mode, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(mode !== 'register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync mode whenever opened or changed
  useEffect(() => {
    setIsLogin(mode !== 'register')
    setErrorMsg('')
    setSuccessMsg('')
  }, [mode])

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)

    try {
      let session
      if (isLogin) {
        session = await signInUser({ email: email.trim(), password })
        setSuccessMsg(`Selamat datang kembali di ZedConsign!`)
      } else {
        if (!name.trim()) throw new Error('Mohon isi nama lengkap Anda.')
        if (password.length < 6) throw new Error('Kata sandi minimal 6 karakter.')
        session = await signUpUser({
          email: email.trim(),
          password,
          fullName: name.trim(),
          phone: phone.trim(),
        })
        setSuccessMsg(`Akun ${name} berhasil didaftarkan!`)
      }

      if (onAuthSuccess) {
        onAuthSuccess(session)
      }

      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan autentikasi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick Demo Login (for instant testing without typing)
  const handleQuickDemo = async () => {
    setErrorMsg('')
    setIsSubmitting(true)
    try {
      const session = await signUpUser({
        email: 'shiddiqyazidn29@gmail.com',
        password: 'password123',
        fullName: 'Shiddiq Yazid Nurhakim',
        phone: '081234567890',
      }).catch(async () => {
        return await signInUser({
          email: 'shiddiqyazidn29@gmail.com',
          password: 'password123',
        })
      })
      setSuccessMsg(`Berhasil masuk sebagai Shiddiq Yazid Nurhakim!`)
      if (onAuthSuccess) onAuthSuccess(session)
      setTimeout(() => onClose(), 900)
    } catch (err) {
      setErrorMsg(err.message || 'Gagal masuk demo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <div className="auth-brand-logo-row">
            <span className="brand-kick">ZED</span>
            <span className="brand-avenue">CONSIGN</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup Dialog"
          >
            &times;
          </button>
        </div>

        <div className="auth-modal-body">
          <div className="auth-tab-switch">
            <button
              type="button"
              className={`auth-switch-btn ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true)
                setErrorMsg('')
                setSuccessMsg('')
              }}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              className={`auth-switch-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false)
                setErrorMsg('')
                setSuccessMsg('')
              }}
            >
              Daftar (Register)
            </button>
          </div>

          {errorMsg && (
            <div className="auth-error-banner" style={{ marginBottom: '14px' }}>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg ? (
            <div className="auth-success-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{successMsg}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label className="form-label">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Contoh: Shiddiq Yazid Nurhakim"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus={!isLogin}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nomor WhatsApp / HP</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Contoh: 081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Alamat Email</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus={isLogin}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kata Sandi</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Memproses...'
                  : isLogin
                  ? 'Masuk ke ZedConsign'
                  : 'Daftar Akun Baru'}
              </button>

              <div className="auth-divider" style={{ margin: '14px 0 10px' }}>
                <span>atau untuk pengujian cepat</span>
              </div>

              <button
                type="button"
                className="btn-quick-demo-login"
                onClick={handleQuickDemo}
                disabled={isSubmitting}
              >
                ⚡ Masuk Cepat sebagai Mahasiswa (Shiddiq Yazid)
              </button>

              <p className="auth-disclaimer">
                Autentikasi terenkripsi aman untuk seluruh transaksi ZedConsign.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
