import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'verdict.user'

/**
 * The session lives in localStorage when "remember me" is checked, and in
 * sessionStorage otherwise (closing the tab signs the user out).
 */
function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function storeUser(user, remember) {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const login = useCallback(async (credentials, { remember = true } = {}) => {
    const response = await api.login(credentials)
    storeUser(response.user, remember)
    setUser(response.user)
    return response.user
  }, [])

  const signup = useCallback(async (payload, { remember = true } = {}) => {
    const response = await api.register(payload)
    storeUser(response.user, remember)
    setUser(response.user)
    return response.user
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({ user, login, signup, logout, isAuthenticated: Boolean(user) }),
    [user, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
