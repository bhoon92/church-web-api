import {
  Building2,
  CalendarRange,
  ChevronRight,
  FolderTree,
  ListChecks,
  Users2,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { Link } from 'react-router'

import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'

type SettingSection = {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  hint: string
  to?: string
}

const SECTIONS: SettingSection[] = [
  {
    icon: Building2,
    title: '교회 정보',
    description: '교회명, 사업자등록번호, 대표자, 주소, 로고 등',
    hint: '영수증 발급 주체',
  },
  {
    icon: Users2,
    title: '역할 (Role)',
    description: '교회 직제에 맞춰 역할을 자유롭게 정의하고 권한을 부여합니다.',
    hint: '5개 활성',
  },
  {
    icon: FolderTree,
    title: '부서·사역팀·목장',
    description: '연령 부서, 사역 단위, 생활 소그룹을 관리합니다.',
    hint: '교회별 사용자 정의',
    to: '/app/settings/references',
  },
  {
    icon: CalendarRange,
    title: '회계연도 (FiscalYear)',
    description: '교회 회계 기간을 설정합니다. 예산·결산은 이 기간에 묶입니다.',
    hint: '2026년 1월 ~ 12월',
  },
  {
    icon: ListChecks,
    title: '카테고리',
    description: '헌금 종류, 계정과목, 예배 종류, 직분 등 reference 데이터.',
    hint: '교회별 사용자 정의',
  },
]

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="설정"
        title="교회 설정"
        description="우리 교회만의 운영 규칙과 데이터를 관리합니다."
      />

      <div className="grid gap-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon
          const card = (
            <Card className="transition-colors hover:bg-[var(--color-muted)]/60">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor:
                      'color-mix(in oklch, var(--color-primary) 12%, transparent)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{s.title}</h3>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      · {s.hint}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--color-muted-foreground)]">
                    {s.description}
                  </p>
                </div>
                <ChevronRight className="size-4 text-[var(--color-muted-foreground)]" />
              </CardContent>
            </Card>
          )
          return s.to ? (
            <Link key={s.title} to={s.to} className="block">
              {card}
            </Link>
          ) : (
            <div key={s.title}>{card}</div>
          )
        })}
      </div>
    </div>
  )
}
