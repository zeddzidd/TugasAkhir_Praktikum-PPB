import { useState } from 'react'

function AuthModal({ mode, onClose }) {
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setSuccessMsg(
      isLogin
        ? `Selamat datang kembali di ZedConsign!`
        : `Akun ${name || 'User'} berhasil didaftarkan di ZedConsign!`
    )
    setTimeout(() => {
      onClose()
    }, 1500)
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
                setSuccessMsg('')
              }}
            >
              Daftar (Register)
            </button>
          </div>

          {successMsg ? (
            <div className="auth-success-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="auth-submit-btn">
                {isLogin ? 'Masuk ke ZedConsign' : 'Buat Akun Baru'}
              </button>

              <p className="auth-disclaimer">
                Dengan melanjutkan, Anda menyetujui Syarat &amp; Ketentuan serta Kebijakan Privasi ZedConsign Marketplace.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
