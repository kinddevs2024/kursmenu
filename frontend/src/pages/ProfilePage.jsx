import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '')

export default function ProfilePage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])

  useEffect(() => {
    if (!user) { navigate('/'); return }
    axios.get(`${API}/api/courses`)
      .then(r => setCourses(r.data.slice(0, 6)))
      .catch(() => {})
  }, [user, navigate])

  if (!user) return null

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Profile header */}
      <div className="profile-header">
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {user.photoUrl ? (
              <img src={user.photoUrl.startsWith('http') ? user.photoUrl : `${API}${user.photoUrl}`} alt="Avatar" className="profile-avatar" style={{ margin: '0 auto 16px', display: 'block', objectFit: 'cover', width: '80px', height: '80px', borderRadius: '50%' }} />
            ) : (
              <div className="profile-avatar" style={{ margin: '0 auto 16px' }}>👤</div>
            )}
            <h2 style={{ marginBottom: 8 }}>Mening Profilim</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Telegram ID: {user.id}
            </p>
            <div style={{ marginTop: 20 }}>
              {!window.Telegram?.WebApp?.initData && (
                <button className="btn btn-outline" onClick={handleLogout} style={{ padding: '10px 28px', fontSize: '0.9rem' }}>
                  Chiqish
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Purchased courses */}
      <section className="section">
        <div className="container">
          <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 8 }}>Sotib olingan kurslar</h3>
          <div className="divider-left" />
          <p style={{ marginBottom: 32, color: 'var(--text-muted)' }}>
            To'langan kurslaringiz bu yerda ko'rinadi
          </p>

          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🛒</div>
              <p style={{ marginBottom: 24 }}>Hali kurs sotib olinmagan</p>
              <Link to="/#courses" className="btn btn-primary" style={{ padding: '14px 32px' }}>
                Kurslarni ko'rish
              </Link>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map(c => (
                <div key={c._id} className="course-card">
                  <div className="course-card-body">
                    <div className="course-card-emoji">{c.emoji || '🍽️'}</div>
                    <h3 className="course-card-title">{c.title}</h3>
                    <div className="course-card-footer">
                      <span className="badge badge-gold">✅ Sotib olingan</span>
                      <Link to={`/course/${c._id}`} className="btn btn-outline" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                        Ochish →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
