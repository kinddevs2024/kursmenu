import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '')
const CYBERSOURCE_URL = import.meta.env.VITE_CYBERSOURCE_URL ||
  'https://testsecureacceptance.cybersource.com/pay'

export default function PayButton({ course }) {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    if (!user || !token) {
      toast.error('Iltimos, avval tizimga kiring')
      return
    }

    setLoading(true)
    try {
      const refNum = `COURSE-${course._id}-${Date.now()}`
      const amount = (course.priceCents / 100).toFixed(2)

      const { data } = await axios.post(
        `${API}/api/payment/checkout`,
        {
          amount,
          currency: 'USD',
          profile_id: import.meta.env.VITE_CS_PROFILE_ID || course.profileId,
          reference_number: refNum,
          course_id: course._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Build and submit the hidden Cybersource form
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = CYBERSOURCE_URL
      form.style.display = 'none'

      Object.entries(data).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      })

      // Add success/cancel override_custom URLs
      const addField = (name, val) => {
        const inp = document.createElement('input')
        inp.type = 'hidden'
        inp.name = name
        inp.value = val
        form.appendChild(inp)
      }
      addField('override_custom_receipt_page', `${window.location.origin}/payment/success?ref=${refNum}`)
      addField('override_custom_cancel_page', `${window.location.origin}/payment/cancel`)

      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error || "To'lov tizimida xatolik. Iltimos qayta urinib ko'ring.")
      setLoading(false)
    }
  }

  return (
    <div className="pay-btn-wrap">
      <motion.button
        className="btn btn-primary"
        style={{ width: '100%', padding: '18px 32px', fontSize: '1.05rem', fontWeight: 600 }}
        onClick={handlePay}
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
      >
        {loading ? (
          <span className="pay-loading">
            <span className="pay-spinner" />
            To'lov sahifasiga o'tilmoqda...
          </span>
        ) : (
          <>
            💳 Kursni sotib olish —{' '}
            {course.priceCents
              ? `$${(course.priceCents / 100).toFixed(2)}`
              : 'Bepul'}
          </>
        )}
      </motion.button>
      <p className="pay-secure">
        🔒 Xavfsiz to'lov · Cybersource
      </p>
    </div>
  )
}
