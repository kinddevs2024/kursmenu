import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))

  useEffect(() => {
    if (token) {
      // Decode JWT payload to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({ id: payload.sub, roles: payload.roles || [], isPremium: payload.isPremium || false })
      } catch {
        setUser(null)
        setToken(null)
        localStorage.removeItem('access_token')
      }
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

  const hasPurchased = (courseId) => {
    return user?.isPremium === true;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasPurchased }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
