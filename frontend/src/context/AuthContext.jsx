import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '')

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))

  useEffect(() => {
    if (token) {
      // Decode JWT payload to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({ id: payload.sub, roles: payload.roles || [], isPremium: payload.isPremium || false, photoUrl: payload.photoUrl || null })
      } catch {
        setUser(null)
        setToken(null)
        localStorage.removeItem('access_token')
      }
    } else {
      setUser(null)
    }
  }, [token])

  const login = (accessToken) => {
    localStorage.setItem('access_token', accessToken)
    setToken(accessToken)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setUser(null)
  }

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.accessToken && res.data.accessToken !== token) {
        login(res.data.accessToken)
      }
    } catch (err) {
      // Ignore errors
    }
  }, [token])

  // Telegram Mini App Auto-Login
  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData;
    if (initData) {
      axios.post(`${API}/api/auth/telegram-mini-app`, { initData })
        .then(res => {
          if (res.data.accessToken) {
            login(res.data.accessToken);
          }
        })
        .catch(err => {
          console.error("TMA login error:", err);
        });
    }
  }, [token, login]);

  // Automatically refresh profile and setup WebSocket for instant updates
  useEffect(() => {
    if (token && user && !user.isPremium) {
      refreshProfile()
      
      const socket = io(API, {
        withCredentials: true
      });

      socket.on('payment_approved', (data) => {
        if (data.userId === user.id) {
          refreshProfile()
        }
      });

      return () => {
        socket.disconnect();
      }
    }
  }, [token, user?.id, user?.isPremium, refreshProfile])

  const hasPurchased = (courseId) => {
    return user?.isPremium === true;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasPurchased, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
