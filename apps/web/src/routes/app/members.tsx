import { Phone, Plus, Search, UserPlus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'

type LifecycleStage =
  | '방문'
  | '새가족'
  | '정식'
  | '이명'
  | '별세'
  | '장기결석'
  | '익명'

const STAGE_TONE: Record<
  LifecycleStage,
  'neutral' | 'muted' | 'success' | 'warn' | 'danger' | 'accent'
> = {
  방문: 'muted',
  새가족: 'warn',
  정식: 'success',
  이명: 'muted',
  별세: 'neutral',
  장기결석: 'danger',
  익명: 'neutral',
}

type Member = {
  id: string
  name: string
  phone: string
  stage: LifecycleStage
  department?: string
  initials: string
  hue: number
}

const FILTERS: { label: string; stage?: LifecycleStage; count: number }[] = [
  { label: '전체', count: 248 },
  { label: '정식', stage: '정식', count: 186 },
  { label: '새가족', stage: '새가족', count: 14 },
  { label: '방문', stage: '방문', count: 22 },
  { label: '장기결석', stage: '장기결석', count: 7 },
]

const MEMBERS: Member[] = [
  {
    id: '1',
    name: '김민서',
    phone: '010-1234-5678',
    stage: '정식',
    department: '청년부',
    initials: '김민',
    hue: 220,
  },
  {
    id: '2',
    name: '이지훈',
    phone: '010-2233-4455',
    stage: '새가족',
    department: '장년부',
    initials: '이지',
    hue: 30,
  },
  {
    id: '3',
    name: '박서연',
    phone: '010-9988-7766',
    stage: '정식',
    department: '중고등부',
    initials: '박서',
    hue: 280,
  },
  {
    id: '4',
    name: '최도윤',
    phone: '010-5544-3322',
    stage: '방문',
    initials: '최도',
    hue: 160,
  },
  {
    id: '5',
    name: '정유나',
    phone: '010-7788-9900',
    stage: '정식',
    department: '찬양팀',
    initials: '정유',
    hue: 340,
  },
  {
    id: '6',
    name: '한지호',
    phone: '010-1122-3344',
    stage: '장기결석',
    department: '장년부',
    initials: '한지',
    hue: 10,
  },
]

export function MembersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="재적"
        title="성도 명부"
        description="등록된 성도와 새가족을 관리합니다."
        actions={
          <>
            <Button variant="outline">
              <UserPlus />
              새가족 등록
            </Button>
            <Button>
              <Plus />
              성도 추가
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <Input
            placeholder="이름·전화번호·소속으로 검색"
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f, i) => (
          <FilterChip key={f.label} label={f.label} count={f.count} active={i === 0} />
        ))}
      </div>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-[var(--color-border)]">
          {MEMBERS.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--color-muted)]"
            >
              <Avatar initials={m.initials} hue={m.hue} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">
                    {m.name}
                  </span>
                  <Badge tone={STAGE_TONE[m.stage]}>{m.stage}</Badge>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3" />
                    {m.phone}
                  </span>
                  {m.department && <span>· {m.department}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <CardContent className="flex items-center justify-between border-t border-[var(--color-border)] py-3 text-xs text-[var(--color-muted-foreground)]">
          <span>총 248명 중 6명 표시</span>
          <Button variant="ghost" size="sm">
            더 보기
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function FilterChip({
  label,
  count,
  active,
}: {
  label: string
  count: number
  active?: boolean
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-transparent bg-[var(--color-foreground)] text-[var(--color-background)]'
          : 'border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
      )}
    >
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 text-[10px] tabular-nums',
          active
            ? 'bg-white/15 text-current'
            : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
        )}
      >
        {count}
      </span>
    </button>
  )
}

function Avatar({ initials }: { initials: string; hue?: number }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] text-xs font-semibold text-[var(--color-foreground)]">
      {initials}
    </div>
  )
}
