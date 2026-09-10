import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('restaurant_admin_user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('restaurant_admin_token') || null)
  const [loading, setLoading] = useState(true)

  // Verify stored token on initial mount only
  useEffect(() => {
    const verifyInitialSession = async () => {
      const savedToken = localStorage.getItem('restaurant_admin_token')
      if (savedToken) {
        try {
          const res = await api.get('/user', {
            headers: { Authorization: `Bearer ${savedToken}` },
          })
          setUser(res.data.user)
          localStorage.setItem('restaurant_admin_user', JSON.stringify(res.data.user))
        } catch {
          // Token expired or invalid
          setToken(null)
          setUser(null)
          localStorage.removeItem('restaurant_admin_token')
          localStorage.removeItem('restaurant_admin_user')
        }
      }
      setLoading(false)
    }

    verifyInitialSession()
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/login', { email, password })
    const { token: newToken, user: newUser } = response.data

    localStorage.setItem('restaurant_admin_token', newToken)
    localStorage.setItem('restaurant_admin_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
    setLoading(false)

    return newUser
  }

  const logout = async () => {
    try {
      if (token) {
        await api.post('/logout')
      }
    } catch {
      // ignore network failure on logout
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('restaurant_admin_token')
      localStorage.removeItem('restaurant_admin_user')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && user?.role === 'admin',
        isAdmin: user?.role === 'admin',
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
