import {
  CalendarCheck,
  CalendarDays,
  Images,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import { motion } from 'motion/react'
import type { ComponentType, CSSProperties } from 'react'
import { Link, Outlet, useLocation } from 'react-router'

import { useAuth } from '@/auth/auth-context'
import {
  ChurchBrandingProvider,
  useChurchBranding,
} from '@/branding/church-branding'
import { ChurchLogo } from '@/branding/church-logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string; style?: CSSProperties }>
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/app', label: '대시보드', icon: LayoutDashboard, end: true },
  { to: '/app/members', label: '재적', icon: Users },
  { to: '/app/attendance', label: '출석', icon: CalendarCheck },
  { to: '/app/finance', label: '재정', icon: Wallet },
  { to: '/app/calendar', label: '달력', icon: CalendarDays },
  { to: '/app/gallery', label: '갤러리', icon: Images },
]

// 모바일 하단 탭은 5개로 제한 (갤러리는 데스크탑 사이드바에서)
const MOBILE_TABS = NAV.slice(0, 5)

export function AppLayout() {
  return (
    <ChurchBrandingProvider>
      <Shell />
    </ChurchBrandingProvider>
  )
}

function Shell() {
  const location = useLocation()

  return (
    <div className="flex min-h-svh bg-[var(--color-muted)]">
      <DesktopSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex-1 px-4 pt-6 pb-24 sm:px-8 sm:pt-8 md:pb-10"
        >
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </motion.main>

        <MobileTabBar />
      </div>
    </div>
  )
}

function DesktopSidebar() {
  const { logout } = useAuth()
  const branding = useChurchBranding()
  const location = useLocation()

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-background)] px-3 py-4 md:flex">
      <div className="flex items-center gap-3 px-2 py-2">
        <ChurchLogo size="md" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight">
            {branding.name}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
            <span className="inline-block size-1.5 rounded-full bg-[var(--color-primary)]" />
            Yakirim
          </div>
        </div>
      </div>

      <nav className="mt-4 flex flex-col gap-0.5">
        {NAV.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
            active={isActive(item, location.pathname)}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5">
        <SidebarLink
          item={{ to: '/app/settings', label: '설정', icon: Settings }}
          active={location.pathname.startsWith('/app/settings')}
        />
        <button
          onClick={() => void logout()}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          <LogOut className="size-4" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      className={cn(
        'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'text-[var(--color-foreground)]'
          : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
      )}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl"
          style={{
            backgroundColor:
              'color-mix(in oklch, var(--color-primary) 10%, transparent)',
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <Icon
        className="relative size-4"
        style={
          active ? { color: 'var(--color-primary)' } : undefined
        }
      />
      <span className="relative">{item.label}</span>
    </Link>
  )
}

function MobileHeader() {
  const branding = useChurchBranding()

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)]/85 px-4 py-3 backdrop-blur md:hidden">
      <ChurchLogo size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{branding.name}</div>
      </div>
      <LogoutIconButton />
    </header>
  )
}

function LogoutIconButton() {
  const { logout } = useAuth()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => void logout()}
      aria-label="로그아웃"
    >
      <LogOut className="size-4" />
    </Button>
  )
}

function MobileTabBar() {
  const location = useLocation()

  return (
    <nav className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {MOBILE_TABS.map((item) => {
        const active = isActive(item, location.pathname)
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors',
              active
                ? 'text-[var(--color-foreground)]'
                : 'text-[var(--color-muted-foreground)]',
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function isActive(item: NavItem, pathname: string) {
  return item.end ? pathname === item.to : pathname.startsWith(item.to)
}
