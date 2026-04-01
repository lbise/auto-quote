import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react"

import {
  getAuthSession,
  loginWithPassword,
  logoutFromSession,
  type AuthSession,
} from "@/lib/api"

type AuthContextValue = {
  session: AuthSession
  isLoading: boolean
  refreshSession: () => Promise<void>
  login: (payload: { username: string; password: string }) => Promise<void>
  logout: () => Promise<void>
}

const unauthenticatedSession: AuthSession = {
  authenticated: false,
  user_id: null,
  username: null,
  display_name: null,
  trade: null,
}

const AuthContext = createContext<AuthContextValue | null>(null)

function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(unauthenticatedSession)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const response = await getAuthSession()
      setSession(response)
    } catch {
      setSession(unauthenticatedSession)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadSession() {
      try {
        const response = await getAuthSession()
        if (active) {
          setSession(response)
        }
      } catch {
        if (active) {
          setSession(unauthenticatedSession)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadSession()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (payload: { username: string; password: string }) => {
    const response = await loginWithPassword(payload)
    setSession(response)
  }, [])

  const logout = useCallback(async () => {
    await logoutFromSession()
    setSession(unauthenticatedSession)
  }, [])

  const value = useMemo(
    () => ({ session, isLoading, refreshSession, login, logout }),
    [session, isLoading, refreshSession, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
