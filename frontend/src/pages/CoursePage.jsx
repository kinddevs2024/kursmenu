import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Keyboard } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { useAuth } from '../context/AuthContext'
import PaymentModal from '../components/PaymentModal'
import AuthModal from '../components/AuthModal'
import axios from 'axios'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '')

export default function CoursePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, hasPurchased } = useAuth()
  const [course, setCourse] = useState(null)
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const slideViewerRef = useRef(null)
  const purchased = hasPurchased(id)

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true)
      if (slideViewerRef.current?.requestFullscreen) {
        await slideViewerRef.current.requestFullscreen().catch(() => {})
      }
      try {
        if (window.screen?.orientation?.lock) {
          await window.screen.orientation.lock('landscape').catch(() => {})
        }
      } catch (e) {}
    } else {
      setIsFullscreen(false)
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {})
      }
      try {
        if (window.screen?.orientation?.unlock) {
          window.screen.orientation.unlock()
        }
      } catch (e) {}
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false)
        try { window.screen?.orientation?.unlock() } catch(e) {}
      }
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [isFullscreen])

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/courses/${id}`),
      axios.get(`${API}/api/courses/${id}/slides`).catch(() => ({ data: [] }))
    ]).then(([courseRes, slidesRes]) => {
      setCourse(courseRes.data)
      setSlides(slidesRes.data || [])
    }).catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="pay-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
    </div>
  )

  if (!course) return null

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '48px 0 40px'
      }}>
        <div className="container">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
            style={{ marginBottom: 24, fontSize: '0.88rem' }}
          >
            ← Orqaga
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'start' }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: '2.5rem' }}>{course.emoji || '🍽️'}</span>
                <span className="badge badge-gold">{course.category}</span>
              </div>
              <h1 style={{ marginBottom: 16 }}>{course.title}</h1>
              <p style={{ fontSize: '1.1rem', maxWidth: 640, marginBottom: 24, lineHeight: 1.6 }}>
                {course.description || 'Professional oshpaz ko\'rsatmalari bilan ushbu taomni uyda tayyorlashni o\'rganing.'}
              </p>
              
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}>
                <span className="badge badge-accent">⭐ 4.9 reyting</span>
                <span className="badge badge-accent">📹 {course.slidesCount || 10} ta slayd</span>
                <span className="badge badge-accent">⏱ {course.prepTime || '20 daqiqa'}</span>
                <span className="badge badge-accent">🔪 Daraja: {course.difficulty || 'Medium'}</span>
              </div>

              {/* Ingredients preview */}
              <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', maxWidth: 640 }}>
                <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🛒</span> Kerakli masalliqlar
                </h3>
                <ul style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                  {(course.ingredients && course.ingredients.length > 0 ? course.ingredients : ['Tuxum', 'Pomidor', 'Ziravorlar']).map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Purchase card */}
            {!purchased && (
              <div style={{
                background: 'var(--warm-white)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-md)',
                minWidth: 260,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  To'liq kursni ochish
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>bir martalik to'lov · umrboqiy kirish</div>

                {user ? (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '16px', marginBottom: 8, fontSize: '0.95rem' }}
                      onClick={() => setShowPayment(true)}
                    >
                      Sotib olish
                    </button>
                    {showPayment && <PaymentModal course={course} onClose={() => setShowPayment(false)} />}
                  </>
                ) : (
                  <div>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '16px', marginBottom: 8, fontSize: '0.95rem' }}
                      onClick={() => setShowAuth(true)}
                    >
                      📱 Kirish va sotib olish
                    </button>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Telegram orqali ro'yxatdan o'ting</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Slides Viewer */}
      <div className="section">
        <div className="container">
          {purchased || !course.priceCents ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
                <h2 style={{ margin: 0 }}>Kurs materiallari</h2>
                {slides.length > 0 && (
                  <button onClick={toggleFullscreen} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '1.2rem' }}>⛶</span> To'liq ekran
                  </button>
                )}
              </div>

              {slides.length > 0 ? (
                <div 
                  className="slide-viewer"
                  ref={slideViewerRef}
                  style={isFullscreen ? {
                    position: 'fixed', inset: 0, zIndex: 99999, background: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  } : {}}
                >
                  <Swiper
                    modules={[Navigation, Pagination, Keyboard]}
                    navigation
                    pagination={{ clickable: true }}
                    keyboard={{ enabled: true }}
                    style={isFullscreen ? { width: '100%', height: '100%' } : { width: '100%' }}
                  >
                    {slides.map((slide, i) => (
                      <SwiperSlide key={i} style={isFullscreen ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}>
                        <img
                          src={`${API}/api/courses/${id}/slides/${slide}`}
                          alt={`Slayd ${i + 1}`}
                          style={{ width: '100%', maxHeight: isFullscreen ? '100vh' : 520, objectFit: 'contain', background: isFullscreen ? '#000' : 'var(--cream)' }}
                          onError={e => { e.target.src = `https://picsum.photos/seed/${id}-${i}/800/520` }}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                  {isFullscreen && (
                     <button 
                       onClick={toggleFullscreen} 
                       style={{ 
                         position: 'absolute', top: 20, right: 20, zIndex: 100000, 
                         background: 'rgba(255,255,255,0.2)', color: 'white', 
                         border: '1px solid rgba(255,255,255,0.4)', borderRadius: '50%', 
                         width: 44, height: 44, fontSize: '1.4rem', cursor: 'pointer',
                         display: 'flex', alignItems: 'center', justifyContent: 'center'
                       }}
                     >
                       ✕
                     </button>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎬</div>
                  <p>Slaydlar yaqinda qo'shiladi</p>
                </div>
              )}
            </>
          ) : (
            /* Locked state — preview only */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)',
                borderRadius: 'var(--radius-xl)',
                padding: '80px 40px',
                border: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: 20 }}>🔒</div>
              <h2 style={{ marginBottom: 16 }}>Kurs himoyalangan</h2>
              <p style={{ maxWidth: 420, margin: '0 auto 32px', fontSize: '1.05rem' }}>
                Barcha {slides.length || 10} ta slaydni ko'rish uchun kursni sotib oling.
                Bir martalik to'lov — umrboqiy kirish!
              </p>
              {user ? (
                <>
                  <button className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1rem' }} onClick={() => setShowPayment(true)}>
                    Sotib olish
                  </button>
                  {showPayment && <PaymentModal course={course} onClose={() => setShowPayment(false)} />}
                </>
              ) : (
                <button className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1rem' }} onClick={() => setShowAuth(true)}>
                  📱 Kirish va sotib olish
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
