import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '')

export default function PaymentModal({ course, onClose }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1 = Instructions, 2 = Upload, 3 = Success

  const handlePaymeClick = () => {
    // Open payme transfer link in new tab
    window.open('https://transfer.paycom.uz/658ac4dc5c8188fb6e910ab8', '_blank')
    setStep(2)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('receipt', file)
      formData.append('courseId', course._id || course.id)
      
      await axios.post(`${API}/api/receipts/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        }
      })
      
      setStep(3)
      toast.success("Chek muvaffaqiyatli yuborildi!")
    } catch (err) {
      toast.error(err.response?.data?.error || "Xatolik yuz berdi")
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
      style={{ zIndex: 9999 }}
    >
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-icon">💳</div>
        <h2 className="modal-title">To'lov qilish</h2>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <p className="modal-subtitle" style={{ textAlign: 'left', lineHeight: 1.6 }}>
                Kursni xarid qilish uchun quyidagi amallarni bajaring:
                <br /><br />
                1. <b>Payme</b> orqali <b>50,000 UZS</b> to'lovni amalga oshiring. To'lov oynasida summa avtomatik kiritilgan.
                <br />
                2. To'lov muvaffaqiyatli yakunlangach, ekranni skrinshot qiling (chekni saqlab oling).
                <br />
                3. Keyingi qadamda skrinshotni bizga yuboring.
              </p>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 24, padding: '16px' }}
                onClick={handlePaymeClick}
              >
                1. Payme orqali to'lash ↗
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="modal-subtitle" style={{ textAlign: 'left', lineHeight: 1.6 }}>
                To'lovni amalga oshirgan bo'lsangiz, tasdiqlovchi chekni (rasmni) yuklang:
              </p>

              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                marginTop: 24,
                position: 'relative'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>📤</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Chekni shu yerga yuklang</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Faqat rasmlar (JPG, PNG)</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    opacity: 0, cursor: 'pointer'
                  }}
                />
                
                {loading && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12
                  }}>
                    <span className="pay-loading"><span className="pay-spinner"></span> Yuklanmoqda...</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ fontSize: '4rem', textAlign: 'center', margin: '20px 0' }}>✅</div>
              <h3 style={{ textAlign: 'center', marginBottom: 16 }}>Chek qabul qilindi!</h3>
              <p className="modal-subtitle">
                Adminlarimiz to'lovingizni tekshirgandan so'ng, kurs sizga avtomatik tarzda ochiladi. 
                Odatda bu jarayon 5-10 daqiqa vaqt oladi.
              </p>
              <button
                className="btn btn-outline"
                style={{ width: '100%', marginTop: 24 }}
                onClick={onClose}
              >
                Yopish
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
