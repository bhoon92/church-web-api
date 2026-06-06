import { ArrowDownRight, ArrowUpRight, Download, Plus } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'

const TABS = ['헌금', '운영 재정', '부서별 예산'] as const
type Tab = (typeof TABS)[number]

type Offering = {
  id: string
  donor: string
  category: '십일조' | '감사' | '주정' | '선교' | '건축'
  amount: number
  raw?: string
}

const OFFERINGS: Offering[] = [
  { id: '1', donor: '김민서', category: '십일조', amount: 300_000 },
  { id: '2', donor: '이지훈', category: '감사', amount: 50_000 },
  { id: '3', donor: '박서연', category: '주정', amount: 20_000 },
  { id: '4', donor: '정유나', category: '십일조', amount: 250_000 },
  { id: '5', donor: '한지호', category: '선교', amount: 100_000 },
  { id: '6', donor: '오세진', category: '건축', amount: 500_000 },
]

type Budget = {
  name: string
  allocated: number
  used: number
  kind: '부서' | '사역팀' | '목장'
}

const BUDGETS: Budget[] = [
  { name: '청년부', allocated: 3_000_000, used: 1_820_000, kind: '부서' },
  { name: '중고등부', allocated: 2_500_000, used: 1_240_000, kind: '부서' },
  { name: '찬양팀', allocated: 1_500_000, used: 1_410_000, kind: '사역팀' },
  { name: '새가족팀', allocated: 800_000, used: 220_000, kind: '사역팀' },
  { name: '1구역', allocated: 600_000, used: 480_000, kind: '목장' },
]

export function FinancePage() {
  const [tab, setTab] = useState<Tab>('헌금')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="재정"
        title="재정 관리"
        description="개인 헌금과 운영 예산을 한 곳에서 관리합니다."
        actions={
          <>
            <Button variant="outline">
              <Download />
              내보내기
            </Button>
            <Button>
              <Plus />
              빠른 입력
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="이번 달 헌금"
          value="₩ 12,450,000"
          delta={{ value: '+8.2%', positive: true }}
        />
        <SummaryCard
          label="이번 달 지출"
          value="₩ 5,820,000"
          delta={{ value: '-3.1%', positive: false }}
        />
        <SummaryCard
          label="예산 집행률"
          value="42%"
          delta={{ value: '회계연도 기준', positive: true, neutral: true }}
        />
      </div>

      <div className="border-b border-[var(--color-border)]">
        <div className="flex gap-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'relative -mb-px border-b-2 px-1 py-2.5 text-sm font-medium transition-colors',
                tab === t
                  ? 'border-[var(--color-foreground)] text-[var(--color-foreground)]'
                  : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === '헌금' && <OfferingsView />}
      {tab === '운영 재정' && <OperationsView />}
      {tab === '부서별 예산' && <BudgetView />}
    </div>
  )
}

function OfferingsView() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <div className="text-sm font-medium">
            2026-06-07 · 주일 1부 · 입력 세션
          </div>
          <Badge tone="accent">실시간 동기화</Badge>
        </div>
        <div className="grid grid-cols-12 gap-4 border-b border-[var(--color-border)] bg-[var(--color-muted)] px-5 py-2 text-xs font-medium text-[var(--color-muted-foreground)]">
          <div className="col-span-5">성도</div>
          <div className="col-span-3">카테고리</div>
          <div className="col-span-4 text-right">금액</div>
        </div>
        <ul className="divide-y divide-[var(--color-border)]">
          {OFFERINGS.map((o) => (
            <li
              key={o.id}
              className="grid grid-cols-12 items-center gap-4 px-5 py-3"
            >
              <div className="col-span-5 text-sm font-medium">{o.donor}</div>
              <div className="col-span-3">
                <Badge tone="muted">{o.category}</Badge>
              </div>
              <div className="col-span-4 text-right text-sm font-semibold tabular-nums">
                ₩ {o.amount.toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-5 py-3 text-sm">
          <span className="text-[var(--color-muted-foreground)]">
            총 6건
          </span>
          <span className="font-semibold tabular-nums">
            ₩ {OFFERINGS.reduce((s, o) => s + o.amount, 0).toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function OperationsView() {
  const rows = [
    { date: '06-05', name: '6월 임대료', category: '운영비', amount: -1_500_000 },
    { date: '06-04', name: '선교 후원', category: '선교비', amount: -800_000 },
    { date: '06-03', name: '6월 1주차 헌금', category: '헌금수입', amount: 3_120_000 },
    { date: '06-02', name: '청년부 수련회', category: '부서비', amount: -1_200_000 },
  ]
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y divide-[var(--color-border)]">
          {rows.map((r) => {
            const positive = r.amount > 0
            return (
              <li
                key={r.name}
                className="flex items-center gap-4 px-5 py-3.5"
              >
                <div className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
                  {r.date}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {r.category}
                  </div>
                </div>
                <div
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    positive ? 'text-emerald-600' : 'text-[var(--color-foreground)]',
                  )}
                >
                  {positive ? '+' : ''}₩ {Math.abs(r.amount).toLocaleString()}
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

function BudgetView() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {BUDGETS.map((b) => {
        const pct = Math.round((b.used / b.allocated) * 100)
        const remaining = b.allocated - b.used
        const tone =
          pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : ('success' as const)
        return (
          <Card key={b.name}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{b.name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {b.kind}
                  </div>
                </div>
                <Badge tone={tone}>{pct}%</Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-muted-foreground)]">
                    사용
                  </span>
                  <span className="font-medium tabular-nums">
                    ₩ {b.used.toLocaleString()} / ₩{' '}
                    {b.allocated.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: 'var(--color-primary)',
                    }}
                  />
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)]">
                  잔여 ₩ {remaining.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  delta,
}: {
  label: string
  value: string
  delta: { value: string; positive: boolean; neutral?: boolean }
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs text-[var(--color-muted-foreground)]">
          {label}
        </div>
        <div className="mt-1.5 text-2xl font-semibold tabular-nums">
          {value}
        </div>
        <div
          className={cn(
            'mt-2 inline-flex items-center gap-1 text-xs font-medium',
            delta.neutral
              ? 'text-[var(--color-muted-foreground)]'
              : delta.positive
                ? 'text-emerald-600'
                : 'text-rose-600',
          )}
        >
          {!delta.neutral &&
            (delta.positive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            ))}
          {delta.value}
        </div>
      </CardContent>
    </Card>
  )
}
