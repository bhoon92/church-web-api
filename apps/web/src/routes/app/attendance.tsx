import { Calendar, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'

const SERVICES = [
  '주일 1부',
  '주일 2부',
  '수요예배',
  '새벽기도',
  '청년부',
] as const

type Service = (typeof SERVICES)[number]

type Row = {
  id: string
  name: string
  department: string
  present: boolean
}

const ROWS: Row[] = [
  { id: '1', name: '김민서', department: '청년부', present: true },
  { id: '2', name: '이지훈', department: '장년부', present: true },
  { id: '3', name: '박서연', department: '중고등부', present: false },
  { id: '4', name: '정유나', department: '찬양팀', present: true },
  { id: '5', name: '한지호', department: '장년부', present: false },
  { id: '6', name: '오세진', department: '청년부', present: true },
  { id: '7', name: '윤하늘', department: '청년부', present: true },
  { id: '8', name: '강수민', department: '장년부', present: true },
]

export function AttendancePage() {
  const [service, setService] = useState<Service>('주일 1부')
  const present = ROWS.filter((r) => r.present).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="출석"
        title="출석 체크"
        description="예배별 출석을 기록하고 추이를 확인합니다."
        actions={
          <Button variant="outline">
            <Calendar />
            달력 보기
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-[var(--color-muted-foreground)]">
              출석
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {present}
              <span className="ml-1 text-sm font-normal text-[var(--color-muted-foreground)]">
                / {ROWS.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-[var(--color-muted-foreground)]">
              출석률
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {Math.round((present / ROWS.length) * 100)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-[var(--color-muted-foreground)]">
              지난주 대비
            </div>
            <div className="mt-1 text-2xl font-semibold text-emerald-600 tabular-nums">
              +3
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <DateNav />
            <div className="flex flex-wrap gap-1.5">
              {SERVICES.map((s) => (
                <button
                  key={s}
                  onClick={() => setService(s)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    service === s
                      ? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
                      : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <ul className="divide-y divide-[var(--color-border)]">
            {ROWS.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 py-2.5"
              >
                <CheckBox checked={r.present} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {r.department}
                  </div>
                </div>
                {r.present && <Badge tone="success">출석</Badge>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function DateNav() {
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="ghost" size="icon" aria-label="이전 주">
        <ChevronLeft />
      </Button>
      <div className="rounded-xl bg-[var(--color-muted)] px-3 py-1.5 text-sm font-medium">
        2026년 6월 7일 (일)
      </div>
      <Button variant="ghost" size="icon" aria-label="다음 주">
        <ChevronRight />
      </Button>
    </div>
  )
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div
      className={cn(
        'flex size-6 items-center justify-center rounded-md border transition-colors',
        checked
          ? 'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
          : 'border-[var(--color-border)] bg-[var(--color-background)]',
      )}
    >
      {checked && <Check className="size-4" strokeWidth={3} />}
    </div>
  )
}
