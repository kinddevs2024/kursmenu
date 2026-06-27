import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="emoji">🍽️</span>
            <span>Har Kunli <span>Menyu</span></span>
          </Link>

          {/* Desktop links */}
          <ul className="navbar-links">
            <li><Link to="/">Bosh sahifa</Link></li>
            <li><a href="#courses">Kurslar</a></li>
            <li><a href="#features">Afzalliklar</a></li>
            <li><a href="#reviews">Sharhlar</a></li>
          </ul>

          {/* Actions */}
          <div className="navbar-actions">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link to="/profile" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '1.2rem' }}>
                  👤
                </Link>
                <button onClick={handleLogout} className="btn btn-outline hide-on-mobile" style={{ padding: '8px 20px', fontSize: '0.88rem' }}>
                  Chiqish
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.9rem' }}
              >
                Kirish
              </button>
            )}

            {/* Mobile burger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                fontSize: '1.4rem',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
              className="mobile-burger"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                overflow: 'hidden',
                borderTop: '1px solid var(--border)',
                background: 'var(--cream)'
              }}
            >
              <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link to="/" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Bosh sahifa</Link>
                <a href="#courses" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Kurslar</a>
                <a href="#features" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Afzalliklar</a>
                {!user && (
                  <button onClick={() => { setShowAuth(true); setMenuOpen(false) }} className="btn btn-primary" style={{ width: '100%' }}>
                    Kirish
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </>
  )
}
