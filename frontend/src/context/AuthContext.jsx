import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'verdict.user'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const login = useCallback(async (role, userId) => {
    const response = await api.login(role, userId)
    setUser(response.user)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response.user))
    return response.user
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(() => ({ user, login, logout, isAuthenticated: Boolean(user) }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
