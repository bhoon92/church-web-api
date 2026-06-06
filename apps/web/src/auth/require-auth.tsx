import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '@/auth/auth-context'

export function RequireAuth() {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-[var(--color-muted-foreground)]">
        불러오는 중…
      </div>
    )
  }

  if (state.status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 로그인됐는데 활성 교회 없음 → 온보딩
  if (!state.currentChurch) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
