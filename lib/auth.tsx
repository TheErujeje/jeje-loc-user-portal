'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { fetchMe, login as apiLogin, logout as apiLogout, type User } from './api'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('loc_access_token')
    if (stored) {
      setToken(stored)
      // fetchMe silently retries via the refresh token on a 401 before
      // giving up, so a stale 30-min access token doesn't force a fresh
      // login as long as the 30-day refresh token is still valid.
      fetchMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('loc_access_token')
          localStorage.removeItem('loc_refresh_token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { access_token, refresh_token } = await apiLogin(email, password)
    localStorage.setItem('loc_access_token', access_token)
    localStorage.setItem('loc_refresh_token', refresh_token)
    setToken(access_token)
    setUser(await fetchMe())
  }

  const logout = () => {
    apiLogout() // revoke server-side; fire-and-forget, local logout doesn't wait on it
    localStorage.removeItem('loc_access_token')
    localStorage.removeItem('loc_refresh_token')
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    setUser(await fetchMe())
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
