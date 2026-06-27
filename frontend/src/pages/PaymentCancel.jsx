import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function PaymentCancel() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'var(--warm-white)',
          borderRadius: 'var(--radius-xl)',
          padding: '64px 48px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ fontSize: '3.5rem', marginBottom: 24 }}>😔</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 12 }}>To'lov bekor qilindi</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          To'lov amalga oshmadi. Qayta urinib ko'ring yoki boshqa to'lov usulini tanlang.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/#courses" className="btn btn-primary" style={{ padding: '14px 32px' }}>
            Kurslarga qaytish
          </Link>
          <Link to="/" className="btn btn-ghost" style={{ padding: '14px 24px' }}>
            Bosh sahifa
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
