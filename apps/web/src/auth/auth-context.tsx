import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export type AuthAccount = {
  id: number
  email: string
  name: string
  pictureUrl?: string | null
}

export type Membership = {
  id: number
  accountId: number
  churchId: number
  role: 'owner' | 'admin' | 'staff' | 'viewer'
}

export type CurrentChurch = {
  id: number
  name: string
}

export type MeResponse = {
  account: AuthAccount
  memberships: Membership[]
  currentChurch: CurrentChurch | null
  role: Membership['role'] | null
}

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | ({ status: 'authenticated' } & MeResponse)

type AuthContextValue = {
  state: AuthState
  loginWithGoogle: () => void
  devLogin: (email: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchMe(): Promise<MeResponse | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' })
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`auth/me ${res.status}`)
  return res.json()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [optimistic, setOptimistic] = useState<AuthState | null>(null)

  const { data, isPending } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    staleTime: 60_000,
    retry: false,
  })

  const state: AuthState = useMemo(() => {
    if (optimistic) return optimistic
    if (isPending) return { status: 'loading' }
    if (!data) return { status: 'unauthenticated' }
    return { status: 'authenticated', ...data }
  }, [optimistic, isPending, data])

  const loginWithGoogle = useCallback(() => {
    window.location.href = '/api/auth/google'
  }, [])

  const devLogin = useCallback(
    async (email: string, name?: string) => {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, name }),
      })
      if (!res.ok) throw new Error('dev-login failed')
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setOptimistic(null)
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setOptimistic({ status: 'unauthenticated' })
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    setOptimistic(null)
  }, [queryClient])

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ state, loginWithGoogle, devLogin, logout, refresh }),
    [state, loginWithGoogle, devLogin, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
