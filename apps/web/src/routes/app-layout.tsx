import {
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  Globe2,
  GraduationCap,
  HelpCircle,
  Images,
  LayoutDashboard,
  LogOut,
  Network,
  Search,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';

import { useAuth } from '@/auth/auth-context';
import { ChurchBrandingProvider, useChurchBranding } from '@/branding/church-branding';
import { ChurchLogo } from '@/branding/church-logo';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  end?: boolean;
};

type NavGroup = {
  /** 섹션 라벨. null 이면 라벨 없이 최상단에 붙는다(홈). */
  label: string | null;
  items: NavItem[];
};

/**
 * flex 처럼 메뉴를 성격별로 묶는다. 평평한 9개 목록은 훑기 어렵다.
 * 순서 = 이 교회의 우선순위 (양성이 사역·운영보다 먼저).
 */
const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ to: '/app', label: '홈', icon: LayoutDashboard, end: true }] },
  {
    label: '양성',
    items: [
      { to: '/app/members', label: '교인', icon: Users },
      { to: '/app/training', label: '훈련', icon: GraduationCap },
      { to: '/app/missionaries', label: '선교사', icon: Globe2 },
    ],
  },
  {
    label: '사역',
    items: [
      { to: '/app/attendance', label: '출석', icon: CalendarCheck },
      { to: '/app/calendar', label: '달력', icon: CalendarDays },
      { to: '/app/gallery', label: '갤러리', icon: Images },
      { to: '/app/organization-chart', label: '조직도', icon: Network },
    ],
  },
  { label: '운영', items: [{ to: '/app/finance', label: '재정', icon: Wallet }] },
];

const ALL_NAV = NAV_GROUPS.flatMap(group => group.items);

// 모바일 하단 탭은 5개로 제한 (나머지는 데스크탑 사이드바에서)
const MOBILE_TABS = ALL_NAV.slice(0, 5);

export function AppLayout() {
  return (
    <ChurchBrandingProvider>
      <Shell />
    </ChurchBrandingProvider>
  );
}

function Shell() {
  const location = useLocation();

  return (
    <div className="flex min-h-svh bg-[var(--color-canvas)]">
      <DesktopSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <MobileHeader />

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex-1 px-4 pt-6 pb-24 sm:px-8 sm:pt-7 md:pb-10"
        >
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </motion.main>

        <MobileTabBar />
      </div>
    </div>
  );
}

function DesktopSidebar() {
  const branding = useChurchBranding();
  const location = useLocation();

  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-background)] px-3 py-4 md:flex">
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <ChurchLogo size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold tracking-tight">{branding.name}</div>
        </div>
      </div>

      <nav className="mt-5 flex flex-col gap-5 overflow-y-auto">
        {NAV_GROUPS.map((group, index) => (
          <div key={group.label ?? `group-${index}`} className="flex flex-col gap-0.5">
            {group.label && (
              <div className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-[var(--color-muted-foreground)]">{group.label}</div>
            )}
            {group.items.map(item => (
              <SidebarLink key={item.to} item={item} active={isActive(item, location.pathname)} />
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-4">
        <SidebarLink item={{ to: '/app/settings', label: '설정', icon: Settings }} active={location.pathname.startsWith('/app/settings')} />
      </div>
    </aside>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'text-[var(--color-foreground)]'
          : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
      )}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg bg-[var(--color-muted)]"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <Icon className="relative size-[18px]" />
      <span className="relative">{item.label}</span>
    </Link>
  );
}

/**
 * 상단바 — flex 의 그 줄. 전역 검색 / 도움말 / 알림 / 프로필.
 * 검색은 아직 백엔드 전역 검색이 없어 교인 검색으로 보낸다(있는 것만 연결).
 */
function TopBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const keyword = query.trim();
    navigate(keyword ? `/app/members?q=${encodeURIComponent(keyword)}` : '/app/members');
  };

  return (
    <header className="sticky top-0 z-20 hidden h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)]/90 px-6 backdrop-blur md:flex">
      <form onSubmit={submit} className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="교인을 검색해보세요"
          className="w-full rounded-lg bg-[var(--color-muted)] py-2 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-[var(--color-muted-foreground)] focus:bg-[var(--color-background)] focus:ring-2 focus:ring-[var(--color-border)]"
        />
      </form>

      <div className="ml-auto flex items-center gap-1">
        <Link
          to="/app/settings"
          className="inline-flex size-9 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          aria-label="도움말·설정"
          title="설정"
        >
          <HelpCircle className="size-[18px]" />
        </Link>
        <ProfileMenu />
      </div>
    </header>
  );
}

/** 프로필 메뉴 — 계정/역할, 소속 교회 전환, 설정, 로그아웃. */
function ProfileMenu() {
  const { state, logout, selectChurch } = useAuth();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (state.status !== 'authenticated') return null;
  const { account, memberships, currentChurch, role } = state;

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen(value => !value)}
        className="flex items-center gap-1.5 rounded-lg p-1 transition-colors hover:bg-[var(--color-muted)]"
        aria-label="프로필 메뉴"
      >
        <Avatar name={account.name} src={account.pictureUrl} size="sm" />
        <ChevronDown className="size-3.5 text-[var(--color-muted-foreground)]" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-md">
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <Avatar name={account.name} src={account.pictureUrl} size="md" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{account.name}</div>
              <div className="truncate text-xs text-[var(--color-muted-foreground)]">{account.email}</div>
              {role && <div className="mt-0.5 text-[11px] text-[var(--color-muted-foreground)]">{ROLE_LABEL[role]}</div>}
            </div>
          </div>

          {memberships.length > 1 && (
            <div className="border-b border-[var(--color-border)] py-1.5">
              <div className="px-4 pb-1 text-[11px] font-semibold text-[var(--color-muted-foreground)]">소속 교회</div>
              {memberships.map(membership => (
                <button
                  key={membership.id}
                  onClick={() => void selectChurch(membership.churchId)}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-muted)]',
                    membership.churchId === currentChurch?.id && 'font-semibold'
                  )}
                >
                  <span className="truncate">{membership.churchName ?? `교회 ${membership.churchId}`}</span>
                  {membership.churchId === currentChurch?.id && (
                    <span className="ml-2 size-1.5 shrink-0 rounded-full bg-[var(--color-brand)]" />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="py-1.5">
            <Link
              to="/app/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-[var(--color-muted)]"
            >
              <Settings className="size-4 text-[var(--color-muted-foreground)]" />
              설정
            </Link>
            <button
              onClick={() => void logout()}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--color-muted)]"
            >
              <LogOut className="size-4 text-[var(--color-muted-foreground)]" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = {
  owner: '소유자',
  admin: '관리자',
  staff: '사역자',
  viewer: '조회 전용',
};

function MobileHeader() {
  const branding = useChurchBranding();
  const { state } = useAuth();
  const account = state.status === 'authenticated' ? state.account : null;

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)]/85 px-4 py-3 backdrop-blur md:hidden">
      <ChurchLogo size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{branding.name}</div>
      </div>
      <Link to="/app/settings" aria-label="설정">
        {account ? (
          <Avatar name={account.name} src={account.pictureUrl} size="sm" />
        ) : (
          <Button variant="ghost" size="icon">
            <Settings className="size-4" />
          </Button>
        )}
      </Link>
    </header>
  );
}

function MobileTabBar() {
  const location = useLocation();

  return (
    <nav className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {MOBILE_TABS.map(item => {
        const active = isActive(item, location.pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors',
              active ? 'text-[var(--color-foreground)]' : 'text-[var(--color-muted-foreground)]'
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function isActive(item: NavItem, pathname: string): boolean {
  return item.end ? pathname === item.to : pathname.startsWith(item.to);
}
