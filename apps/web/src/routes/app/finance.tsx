import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { fetchDashboard, formatKRW } from '@/api/finance'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'
import { OfferingsView } from './finance/offerings-view'
import { OperationsView } from './finance/operations-view'
import { BudgetView } from './finance/budget-view'

const TABS = ['헌금', '운영 재정', '부서별 예산'] as const
type Tab = (typeof TABS)[number]

export function FinancePage() {
  const [tab, setTab] = useState<Tab>('헌금')

  const { data: dashboard } = useQuery({
    queryKey: ['finance', 'dashboard'],
    queryFn: fetchDashboard,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="재정"
        title="재정 관리"
        description="개인 헌금과 운영 예산을 한 곳에서 관리합니다."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="이번 달 헌금" value={formatKRW(dashboard?.thisMonthOffering ?? 0)} hint={dashboard?.month} />
        <SummaryCard label="이번 달 지출" value={formatKRW(dashboard?.thisMonthExpense ?? 0)} hint={dashboard?.month} />
        <SummaryCard
          label="예산 집행률"
          value={dashboard?.budget ? `${dashboard.budget.rate}%` : '—'}
          hint={dashboard?.fiscalYear?.name ?? '회계연도 미설정'}
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

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs text-[var(--color-muted-foreground)]">{label}</div>
        <div className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</div>
        {hint && (
          <div className="mt-2 text-xs text-[var(--color-muted-foreground)]">{hint}</div>
        )}
      </CardContent>
    </Card>
  )
}
