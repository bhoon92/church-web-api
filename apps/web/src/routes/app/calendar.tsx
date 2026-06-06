import { ChevronLeft, ChevronRight, Plus, Share2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'

type LayerKind = '공지' | '전체' | '부서' | '사역팀' | '목장' | '개인'

type CalendarLayer = {
  id: string
  name: string
  kind: LayerKind
  color: string
  on: boolean
}

const INITIAL_LAYERS: CalendarLayer[] = [
  { id: 'notice', name: '공지사항', kind: '공지', color: 'oklch(0.65 0.18 25)', on: true },
  { id: 'church', name: '전체 / 절기', kind: '전체', color: 'oklch(0.55 0.14 250)', on: true },
  { id: 'youth', name: '청년부', kind: '부서', color: 'oklch(0.62 0.15 160)', on: true },
  { id: 'middle', name: '중고등부', kind: '부서', color: 'oklch(0.6 0.16 300)', on: false },
  { id: 'praise', name: '찬양팀', kind: '사역팀', color: 'oklch(0.65 0.15 50)', on: true },
  { id: 'cell', name: '1구역', kind: '목장', color: 'oklch(0.6 0.14 200)', on: false },
  { id: 'me', name: '내 일정', kind: '개인', color: 'oklch(0.55 0.04 240)', on: true },
]

type Event = {
  day: number
  title: string
  layerId: string
  time?: string
}

const EVENTS: Event[] = [
  { day: 2, title: '주일예배', layerId: 'church', time: '11:00' },
  { day: 2, title: '청년 모임', layerId: 'youth', time: '14:00' },
  { day: 5, title: '수요예배', layerId: 'church', time: '19:30' },
  { day: 7, title: '여름수련회 공지', layerId: 'notice' },
  { day: 9, title: '주일예배', layerId: 'church', time: '11:00' },
  { day: 9, title: '찬양 연습', layerId: 'praise', time: '15:00' },
  { day: 12, title: '수요예배', layerId: 'church', time: '19:30' },
  { day: 13, title: '심방 — 김민서', layerId: 'me', time: '10:00' },
  { day: 16, title: '주일예배', layerId: 'church', time: '11:00' },
  { day: 17, title: '여름수련회', layerId: 'youth' },
  { day: 18, title: '여름수련회', layerId: 'youth' },
  { day: 19, title: '여름수련회', layerId: 'youth' },
  { day: 23, title: '주일예배', layerId: 'church', time: '11:00' },
]

export function CalendarPage() {
  const [layers, setLayers] = useState(INITIAL_LAYERS)

  const visibleLayerIds = new Set(layers.filter((l) => l.on).map((l) => l.id))
  const layerById = new Map(layers.map((l) => [l.id, l]))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="달력"
        title="2026년 6월"
        description="공지·부서·개인 일정을 한 화면에서 확인합니다."
        actions={
          <>
            <Button variant="outline">
              <Share2 />
              구독 링크
            </Button>
            <Button>
              <Plus />
              일정 추가
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <Card className="h-fit">
          <CardContent className="space-y-1 p-3">
            <div className="px-2 py-1.5 text-xs font-medium text-[var(--color-muted-foreground)]">
              내 캘린더
            </div>
            <ul className="space-y-0.5">
              {layers.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() =>
                      setLayers((prev) =>
                        prev.map((p) =>
                          p.id === l.id ? { ...p, on: !p.on } : p,
                        ),
                      )
                    }
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-muted)]"
                  >
                    <span
                      className={cn(
                        'flex size-4 items-center justify-center rounded-[5px] border transition-all',
                        l.on
                          ? 'border-transparent'
                          : 'border-[var(--color-border)] bg-transparent',
                      )}
                      style={l.on ? { backgroundColor: l.color } : undefined}
                    >
                      {l.on && (
                        <svg
                          viewBox="0 0 12 12"
                          className="size-3 text-white"
                          aria-hidden
                        >
                          <path
                            d="M2.5 6.5 5 9l4.5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={cn(
                        'flex-1 truncate',
                        l.on
                          ? 'text-[var(--color-foreground)]'
                          : 'text-[var(--color-muted-foreground)]',
                      )}
                    >
                      {l.name}
                    </span>
                    <span className="text-[10px] text-[var(--color-muted-foreground)]">
                      {l.kind}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" aria-label="이전 달">
                  <ChevronLeft />
                </Button>
                <div className="px-2 text-sm font-semibold">2026년 6월</div>
                <Button variant="ghost" size="icon" aria-label="다음 달">
                  <ChevronRight />
                </Button>
              </div>
              <Button variant="ghost" size="sm">
                오늘
              </Button>
            </div>

            <div className="grid grid-cols-7 border-t border-l border-[var(--color-border)]">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div
                  key={d}
                  className={cn(
                    'border-r border-b border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-1.5 text-[11px] font-medium',
                    i === 0 && 'text-rose-500',
                    i === 6 && 'text-sky-500',
                  )}
                >
                  {d}
                </div>
              ))}
              {buildMonthGrid().map((cell, i) => {
                const events = cell
                  ? EVENTS.filter(
                      (e) =>
                        e.day === cell &&
                        visibleLayerIds.has(e.layerId),
                    )
                  : []
                const isToday = cell === 6
                return (
                  <div
                    key={i}
                    className={cn(
                      'min-h-24 border-r border-b border-[var(--color-border)] p-1.5',
                      !cell && 'bg-[var(--color-muted)]/40',
                    )}
                  >
                    {cell && (
                      <>
                        <div
                          className={cn(
                            'mb-1 inline-flex size-6 items-center justify-center text-xs font-medium tabular-nums',
                            isToday &&
                              'rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
                          )}
                        >
                          {cell}
                        </div>
                        <div className="space-y-1">
                          {events.slice(0, 3).map((e, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px]"
                              style={{
                                backgroundColor: `color-mix(in oklch, ${layerById.get(e.layerId)?.color} 14%, transparent)`,
                                color: layerById.get(e.layerId)?.color,
                              }}
                            >
                              <span
                                className="inline-block size-1.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    layerById.get(e.layerId)?.color,
                                }}
                              />
                              <span className="truncate font-medium">
                                {e.title}
                              </span>
                            </div>
                          ))}
                          {events.length > 3 && (
                            <div className="px-1.5 text-[10px] text-[var(--color-muted-foreground)]">
                              +{events.length - 3}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function buildMonthGrid(): (number | null)[] {
  // June 2026: starts on Monday (day index 1), 30 days
  const startWeekday = 1
  const daysInMonth = 30
  const cells: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
