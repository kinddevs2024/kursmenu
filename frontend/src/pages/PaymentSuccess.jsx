import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function PaymentSuccess() {
  const [params] = useSearchParams()
  const ref = params.get('ref')

  useEffect(() => {
    // Mark purchase in localStorage (real apps should verify via backend webhook)
    if (ref) {
      const courseId = ref.split('-')[1]
      if (courseId) {
        const purchases = JSON.parse(localStorage.getItem('purchases') || '[]')
        if (!purchases.includes(courseId)) {
          purchases.push(courseId)
          localStorage.setItem('purchases', JSON.stringify(purchases))
        }
      }
    }
  }, [ref])

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        style={{
          background: 'var(--warm-white)',
          borderRadius: 'var(--radius-xl)',
          padding: '64px 48px',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)'
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 15 }}
          style={{ fontSize: '4rem', marginBottom: 24 }}
        >
          🎉
        </motion.div>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: 12 }}>
          To'lov muvaffaqiyatli!
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
          Kurs sizning profilingizga qo'shildi. Hoziroq o'rganishni boshlang!
        </p>
        {ref && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 32 }}>
            Buyurtma: {ref}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/profile" className="btn btn-primary" style={{ padding: '14px 32px' }}>
            Profilga o'tish
          </Link>
          <Link to="/" className="btn btn-outline" style={{ padding: '14px 28px' }}>
            Bosh sahifa
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
