import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import axios from 'axios'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '')

// ─── Animation Variants ───────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.4, 0, 0.2, 1] }
  })
}

const FEATURES = [
  { icon: '🎬', title: 'Rasm darsliklar', desc: 'sifatli rasm ko\'rsatmalar bilan har bir bosqichni tushuning' },
  { icon: '🍳', title: '50+ Retsept', desc: 'Kattalar va bolalar uchun mos, 50 dan ortiq taom retsepti' },
  { icon: '📱', title: 'Qulay kirish', desc: 'Telefon, planshet yoki kompyuterdan istalgan vaqtda kirish' },
  { icon: '👨‍🍳', title: 'Professional', desc: 'Professional oshpaz tajribasi asosida tayyorlangan darslar' },
]

const TESTIMONIALS = [
  { text: 'Kurs juda foydali bo\'ldi! Endi oilamga restoran darajasida Shirinlik Tayyorlangy olayman.', name: 'Malika T.', role: 'O\'quvchi', stars: 5 },
  { text: 'Har bir retsept aniq va tushunarli. Befstroganov darsi mening sevimli darskim!', name: 'Jasur K.', role: 'O\'quvchi', stars: 5 },
  { text: 'Telegram orqali kirish juda qulay. Bir daqiqada tizimga kirdim.', name: 'Dilnoza A.', role: 'O\'quvchi', stars: 5 },
]

// ─── Course Card ──────────────────────────────────────
function CourseCard({ dish, index, onBuyClick }) {
  const { hasPurchased } = useAuth()
  const purchased = hasPurchased(dish._id)
  
  // Try to use the first slide as thumbnail, fallback to Picsum
  const thumbnailUrl = dish.thumbnailUrl || `${API}/api/courses/${dish._id}/slides/slide-01.png`

  return (
    <motion.div
      className="course-card"
      variants={fadeUp}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      <div className="course-card-image">
        <img
          src={thumbnailUrl}
          alt={dish.title}
          loading="lazy"
          onError={e => { e.target.src = '/images/hero.jpg' }}
        />
        <div className="course-card-badge">
          <span className="badge badge-gold">Yangi</span>
        </div>
        {!purchased && (
          <div className="course-card-lock">
            <span className="lock-icon">🔒</span>
          </div>
        )}
      </div>

      <div className="course-card-body">
        <div className="course-card-emoji">{dish.emoji || '🍽️'}</div>
        <h3 className="course-card-title">{dish.title}</h3>
        <p className="course-card-desc">
          {dish.description || 'Ushbu taomni uyda osongina tayyorlashni o\'rganing. Bosqichma-bosqich ko\'rsatmalar bilan.'}
        </p>

        <div className="course-card-meta">
          <span>📹 {dish.slidesCount || '10'}+ slayd</span>
          <span>⏱ {dish.prepTime || '15 min'}</span>
          <span>⭐ 4.9</span>
        </div>

        <div className="course-card-footer" style={{ justifyContent: 'flex-end' }}>
          {purchased ? (
            <Link to={`/course/${dish._id}`} className="btn btn-outline" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
              Tomosha qilish →
            </Link>
          ) : (
            <button
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
              onClick={() => onBuyClick(dish)}
            >
              Sotib olish
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth()
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [selectedDish, setSelectedDish] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 9

  useEffect(() => {
    axios.get(`${API}/api/courses`)
      .then(r => setDishes(r.data))
      .catch(() => setDishes([]))
      .finally(() => setLoading(false))
  }, [])

  const handleBuyClick = (dish) => {
    setSelectedDish(dish)
    if (!user) setShowAuth(true)
    else window.location.href = `/course/${dish._id}`
  }

  const filtered = dishes.filter(d =>
    d.title?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedDishes = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          {/* Left */}
          <div>
            <motion.div className="hero-eyebrow" variants={fadeUp} custom={0} initial="hidden" animate="visible">
              🌟 Oshpazlik kurslari
            </motion.div>

            <motion.h1 className="hero-title" variants={fadeUp} custom={1} initial="hidden" animate="visible">
              Har Kuni <span className="italic">Yangi</span>
              <br />Shirinlik Tayyorlang
            </motion.h1>

            <motion.p className="hero-subtitle" variants={fadeUp} custom={2} initial="hidden" animate="visible">
              50 ta taomni uyda professional darajada
            </motion.p>

            <motion.p className="hero-desc" variants={fadeUp} custom={3} initial="hidden" animate="visible">
              Shakshuka, Biryani, Befstroganov, Fish & Chips va boshqa 46 ta mazali taomni
              video darslar orqali o'rganing. Bir martalik to'lov — umrboqiy kirish.
            </motion.p>

            <motion.div className="hero-actions" variants={fadeUp} custom={4} initial="hidden" animate="visible">
              <a href="#courses" className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '1rem' }}>
                Kurslarni ko'rish 🍽️
              </a>
              {!user && (
                <button
                  className="btn btn-outline"
                  style={{ padding: '16px 28px', fontSize: '1rem' }}
                  onClick={() => setShowAuth(true)}
                >
                  Kirish / Ro'yxatdan o'tish
                </button>
              )}
            </motion.div>

            <motion.div className="hero-stats" variants={fadeUp} custom={5} initial="hidden" animate="visible">
              <div>
                <div className="hero-stat-number">50+</div>
                <div className="hero-stat-label">Taom retsepti</div>
              </div>
              <div>
                <div className="hero-stat-number">1000+</div>
                <div className="hero-stat-label">Mamnun o'quvchi</div>
              </div>
              <div>
                <div className="hero-stat-number">4.9⭐</div>
                <div className="hero-stat-label">Reyting</div>
              </div>
            </motion.div>
          </div>

          {/* Right — hero image */}
          <motion.div
            className="hero-image-wrap"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <img
              src="/images/hero.jpg"
              alt="Mazali taomlar"
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&q=80' }}
            />
            <div className="hero-image-badge">
              <div className="num">50</div>
              <div className="lbl">ta taom</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────── */}
      <section className="section-sm" id="features" style={{ background: 'var(--cream-dark)' }}>
        <div className="container">
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="feature-card"
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COURSES ──────────────────────────────────── */}
      <section className="section" id="courses">
        <div className="container">
          <div className="section-header">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="badge badge-gold" style={{ marginBottom: 12, display: 'inline-block' }}>Kurslar</span>
              <div className="divider" />
              <h2>Barcha Taomlar</h2>
              <p>Dunyoning turli burchaklaridan kelgan 50 ta mazali taom retsepti</p>
            </motion.div>
          </div>

          {/* Search */}
          <motion.div
            style={{ marginBottom: 40, maxWidth: 400, margin: '0 auto 40px' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="🔍  Taom qidiring..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ width: '100%', marginBottom: 0 }}
            />
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="courses-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="course-card" style={{ minHeight: 380 }}>
                  <div style={{ height: 220, background: 'var(--cream-dark)', borderRadius: 0 }} />
                  <div className="course-card-body">
                    <div style={{ height: 16, background: 'var(--cream-dark)', borderRadius: 8, marginBottom: 8 }} />
                    <div style={{ height: 12, background: 'var(--cream-dark)', borderRadius: 8, width: '70%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
              <p>Bunday taom topilmadi</p>
            </div>
          ) : (
            <>
              <div className="courses-grid">
                {paginatedDishes.map((dish, i) => (
                  <CourseCard key={dish._id} dish={dish} index={i} onBuyClick={handleBuyClick} />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
                  <button
                    className="btn btn-outline"
                    disabled={page === 1}
                    onClick={() => {
                      setPage(p => Math.max(1, p - 1));
                      window.scrollTo({ top: document.getElementById('courses').offsetTop - 80, behavior: 'smooth' });
                    }}
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  >
                    Oldingi
                  </button>
                  
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setPage(i + 1);
                          window.scrollTo({ top: document.getElementById('courses').offsetTop - 80, behavior: 'smooth' });
                        }}
                        style={{
                          width: 40, height: 40, borderRadius: 8, border: 'none',
                          background: page === i + 1 ? 'var(--accent)' : 'var(--cream)',
                          color: page === i + 1 ? '#fff' : 'var(--text-primary)',
                          fontWeight: 600, cursor: 'pointer', transition: '0.2s'
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn btn-outline"
                    disabled={page === totalPages}
                    onClick={() => {
                      setPage(p => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: document.getElementById('courses').offsetTop - 80, behavior: 'smooth' });
                    }}
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  >
                    Keyingi
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────── */}
      <section className="section" id="reviews" style={{ background: 'var(--cream-dark)' }}>
        <div className="container">
          <div className="section-header">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2>O'quvchilar fikri</h2>
              <div className="divider" />
              <p>1000 dan ortiq mamnun o'quvchilarimiz fikri</p>
            </motion.div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                className="testimonial-card"
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="testimonial-stars">{'⭐'.repeat(t.stars)}</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────── */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #C94055 100%)',
              borderRadius: 'var(--radius-xl)',
              padding: '64px 48px',
              textAlign: 'center',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")',
              pointerEvents: 'none'
            }} />
            <h2 style={{ color: '#fff', fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: 16, position: 'relative' }}>
              Bugunoq boshlang! 🍽️
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px', position: 'relative' }}>
              50 ta taom retsepti, umrboqiy kirish huquqi, Telegram orqali ro'yxatdan o'ting.
            </p>
            <div style={{ position: 'relative', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#courses" className="btn" style={{ background: '#fff', color: 'var(--accent)', padding: '16px 40px', fontSize: '1rem', fontWeight: 600 }}>
                Kurslarni ko'rish
              </a>
              {!user && (
                <button
                  className="btn"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '16px 36px', fontSize: '1rem' }}
                  onClick={() => setShowAuth(true)}
                >
                  📱 Telegram orqali kirish
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
