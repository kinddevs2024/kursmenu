import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '')

export default function AuthModal({ onClose }) {
  const { login } = useAuth()
  const [tab, setTab] = useState('register') // 'register' | 'login'
  const [step, setStep] = useState('start') // 'start' | 'code' (for login flow)
  const [telegramId, setTelegramId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendCode = async (e) => {
    e.preventDefault()
    if (!telegramId.trim()) return toast.error("Telegram username kiriting")
    setLoading(true)
    try {
      await axios.post(`${API}/api/auth/start`, { telegramId: telegramId.trim() })
      toast.success("Kod yuborildi! Telegram botingizni tekshiring.")
      setStep('code')
    } catch (err) {
      toast.error(err.response?.data?.error || "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    if (!code.trim()) return toast.error("Kodni kiriting")
    setLoading(true)
    try {
      const { data } = await axios.post(`${API}/api/auth/verify`, {
        telegramId: telegramId.trim(),
        code: code.trim()
      })
      localStorage.setItem('refresh_token', data.refreshToken)
      login(data.accessToken)
      toast.success("Muvaffaqiyatli kirdingiz! 🎉")
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || "Noto'g'ri kod")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Tabs */}
        {step === 'start' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--cream-dark)', padding: 4, borderRadius: 12 }}>
            <button 
              onClick={() => setTab('register')}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: tab === 'register' ? '#fff' : 'transparent', boxShadow: tab === 'register' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontWeight: 600, color: tab === 'register' ? 'var(--text-primary)' : 'var(--text-muted)', transition: '0.2s' }}
            >
              Ro'yxatdan o'tish
            </button>
            <button 
              onClick={() => setTab('login')}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: tab === 'login' ? '#fff' : 'transparent', boxShadow: tab === 'login' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontWeight: 600, color: tab === 'login' ? 'var(--text-primary)' : 'var(--text-muted)', transition: '0.2s' }}
            >
              Kirish
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {tab === 'register' ? (
            <motion.div key="register" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="modal-icon">🤖</div>
              <h2 className="modal-title">Xush kelibsiz!</h2>
              <p className="modal-subtitle">Ro'yxatdan o'tish uchun bizning Telegram botimizga kiring</p>

              <div className="tg-steps">
                <ol>
                  <li>Quyidagi tugmani bosib botga kiring</li>
                  <li><strong>/start</strong> buyrug'ini bosing</li>
                  <li>Ismingiz va raqamingizni yuboring</li>
                  <li>Bot sizga avtomatik kirish ssilkasini beradi!</li>
                </ol>
              </div>

              <a
                href={`https://t.me/HarKunliMenyuBot?start=auth`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: 0, textAlign: 'center', display: 'block', padding: '16px' }}
              >
                📱 Telegram Botga O'tish ↗
              </a>
            </motion.div>
          ) : step === 'start' ? (
            <motion.div key="login-start" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="modal-icon">🔐</div>
              <h2 className="modal-title">Profilga kirish</h2>
              <p className="modal-subtitle">Ro'yxatdan o'tgan bo'lsangiz, Telegram username yoki ID kiriting</p>

              <form onSubmit={handleSendCode}>
                <div className="form-group">
                  <label className="form-label">Telegram Username (@sizning_nikingiz)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="@username"
                    value={telegramId}
                    onChange={e => setTelegramId(e.target.value)}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary form-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="pay-loading">
                      <span className="pay-spinner" />
                      Yuborilmoqda...
                    </span>
                  ) : '📱 Kod yuborish'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="login-code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="modal-icon">📨</div>
              <h2 className="modal-title">Kodni kiriting</h2>
              <p className="modal-subtitle">
                <strong>{telegramId}</strong> pochtasiga/botiga 6 raqamli kod yuborildi
              </p>

              <form onSubmit={handleVerifyCode}>
                <div className="form-group">
                  <label className="form-label">Tasdiqlash kodi</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="123456"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                    maxLength={6}
                    style={{
                      textAlign: 'center',
                      fontSize: '1.8rem',
                      letterSpacing: '0.3em',
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 600
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary form-submit"
                  disabled={loading || code.length < 6}
                >
                  {loading ? (
                    <span className="pay-loading">
                      <span className="pay-spinner" />
                      Tekshirilmoqda...
                    </span>
                  ) : '✅ Tasdiqlash'}
                </button>
              </form>

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setStep('start')}
                  style={{ fontSize: '0.85rem' }}
                >
                  ← Orqaga qaytish
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
