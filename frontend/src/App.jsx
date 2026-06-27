import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CoursePage from './pages/CoursePage'
import ProfilePage from './pages/ProfilePage'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'
import AdminPage from './pages/AdminPage'
import { AuthProvider, useAuth } from './context/AuthContext'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '')

function AutoLogin() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const { login } = useAuth()
  const navigate = useNavigate()
  const hasAttempted = useRef(false)

  useEffect(() => {
    if (token && !hasAttempted.current) {
      hasAttempted.current = true
      
      // Remove token from URL immediately to prevent strict-mode double firing
      const url = new URL(window.location)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url)

      axios.post(`${API}/api/auth/link-login`, { token })
        .then(res => {
          localStorage.setItem('refresh_token', res.data.refreshToken)
          login(res.data.accessToken)
          toast.success("Muvaffaqiyatli kirdingiz! 🎉")
          navigate('/', { replace: true })
        })
        .catch(err => {
          toast.error(err.response?.data?.error || "Havola eskirgan yoki xato")
          navigate('/', { replace: true })
        })
    }
  }, [token, login, navigate])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AutoLogin />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.9rem',
              borderRadius: '12px',
              background: '#FEFCF8',
              color: '#1C1108',
              border: '1px solid #E8E0D0',
              boxShadow: '0 8px 32px rgba(28,17,8,0.12)',
            },
            success: { iconTheme: { primary: '#8B1A2A', secondary: '#fff' } },
          }}
        />
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/course/:id" element={<CoursePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}
