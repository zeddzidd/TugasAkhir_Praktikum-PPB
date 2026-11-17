import { useState } from 'react'
import { signUpUser, signInUser } from '../lib/supabase.js'

function AuthModal({ mode, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)

    try {
      let session
      if (isLogin) {
        session = await signInUser({ email, password })
        setSuccessMsg(`Selamat datang kembali di ZedConsign!`)
      } else {
        if (!name.trim()) throw new Error('Mohon isi nama lengkap Anda.')
        if (password.length < 6) throw new Error('Kata sandi minimal 6 karakter.')
        session = await signUpUser({
          email,
          password,
          fullName: name.trim(),
        })
        setSuccessMsg(`Akun ${name} berhasil didaftarkan!`)
      }

      if (onAuthSuccess) {
        onAuthSuccess(session)
      }

      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan autentikasi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <span className="auth-brand-title">ZED CONSIGN</span>
          <button type="button" className="modal-close-btn" onClick={onClose}>
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
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Contoh: Shiddiq Yazid"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
