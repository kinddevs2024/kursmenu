import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '')

export default function AdminPage() {
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminAuth, setAdminAuth] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })

  const handleAdminLogin = (e) => {
    e.preventDefault()
    if (loginForm.username === 'admin' && loginForm.password === '12345') {
      setAdminAuth(true)
      fetchReceipts()
    } else {
      toast.error('Notogri login yoki parol!')
    }
  }

  const fetchReceipts = async () => {
    try {
      const res = await axios.get(`${API}/api/receipts/admin`)
      setReceipts(res.data)
    } catch (err) {
      toast.error('Xatolik yoki ruxsat yo\'q')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (adminAuth) {
      fetchReceipts()
    } else {
      setLoading(false)
    }
  }, [adminAuth])

  const handleVerify = async (id, status, message = '') => {
    try {
      await axios.post(`${API}/api/receipts/admin/${id}/verify`, { status, message })
      toast.success(status === 'approved' ? 'Tasdiqlandi!' : 'Rad etildi')
      fetchReceipts()
    } catch (err) {
      toast.error('Xato yuz berdi')
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Yuklanmoqda...</div>

  if (!adminAuth) {
    return (
      <div className="section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 16, boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 24 }}>Admin Panel</h2>
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 300 }}>
            <input type="text" placeholder="Login (admin)" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
            <input type="password" placeholder="Parol (12345)" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
            <button type="submit" className="btn btn-primary" style={{ padding: 12 }}>Kirish</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="section" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <div className="container">
        <h1 style={{ marginBottom: 32 }}>Admin Panel - To'lovlar</h1>
        
        {receipts.length === 0 ? (
          <p>Hozircha cheklar yo'q</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {receipts.map(r => (
              <motion.div key={r._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#fff', padding: 24, borderRadius: 16, border: '1px solid var(--border)',
                  display: 'flex', gap: 24, alignItems: 'flex-start'
                }}>
                
                <img src={`${API}${r.receiptUrl}`} alt="Chek" style={{ width: 200, borderRadius: 8, border: '1px solid #eee' }} />
                
                <div style={{ flex: 1 }}>
                  <h3>Kurs ID: {r.courseId}</h3>
                  <p><strong>Foydalanuvchi:</strong> {r.userId?.name || 'Noma\'lum'} ({r.userId?.phone || '-'})</p>
                  <p><strong>Holat:</strong> <span className={`badge badge-${r.status === 'pending' ? 'gold' : r.status === 'approved' ? 'accent' : 'outline'}`}>{r.status}</span></p>
                  <p><strong>Sana:</strong> {new Date(r.createdAt).toLocaleString('ru-RU')}</p>
                  
                  {r.status === 'pending' && (
                    <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                      <button className="btn btn-primary" onClick={() => handleVerify(r._id, 'approved')}>
                        ✅ O'tkazish (Tasdiqlash)
                      </button>
                      <button className="btn btn-outline" onClick={() => handleVerify(r._id, 'rejected', "Sizning to'lovingiz 50,000 UZS dan kam.")}>
                        ❌ Rad etish (Kam summa)
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
