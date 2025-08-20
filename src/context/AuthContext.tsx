import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearAccessToken, getAccessPayload, getAccessToken, setAccessToken, type JwtAccessPayload } from '../lib/auth'
import { fetchMyCompany, type Company } from '../lib/company'
import { refreshAccessToken } from '../lib/api'

type AuthState = {
  accessToken: string | null
  user: JwtAccessPayload | null
  company: Company | null
}

type AuthContextValue = AuthState & {
  login: (accessToken: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ accessToken: null, user: null, company: null })

  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      const user = getAccessPayload()
      setState((s) => ({ ...s, accessToken: token, user }))
      fetchMyCompany().then((c) => setState((s) => ({ ...s, company: c }))).catch((err) => {
        // If company fetch fails with auth error, clear auth state
        if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
          clearAccessToken()
          setState({ accessToken: null, user: null, company: null })
        }
      })
      return
    }
    // Attempt silent refresh using HttpOnly cookie on boot
    refreshAccessToken().then((ok) => {
      if (ok) {
        const newToken = getAccessToken()
        const user = getAccessPayload()
        setState((s) => ({ ...s, accessToken: newToken, user }))
        fetchMyCompany().then((c) => setState((s) => ({ ...s, company: c }))).catch((err) => {
          // If company fetch fails with auth error, clear auth state
          if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
            clearAccessToken()
            setState({ accessToken: null, user: null, company: null })
          }
        })
      }
    })
  }, [])

  const login = useCallback((accessToken: string) => {
    setAccessToken(accessToken)
    const user = getAccessPayload()
    setState((s) => ({ ...s, accessToken, user }))
    fetchMyCompany().then((c) => setState((s) => ({ ...s, company: c }))).catch((err) => {
      // If company fetch fails with auth error, clear auth state
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
        clearAccessToken()
        setState({ accessToken: null, user: null, company: null })
      }
    })
  }, [])

  const logout = useCallback(() => {
    clearAccessToken()
    setState({ accessToken: null, user: null, company: null })
  }, [])

  const value = useMemo<AuthContextValue>(() => ({ ...state, login, logout }), [state, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


