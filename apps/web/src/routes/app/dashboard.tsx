import { ArrowUpRight, CalendarCheck, CalendarDays, ChevronRight, TrendingUp, UserPlus, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import type { ComponentType } from 'react';

import { useChurchBranding } from '@/branding/church-branding';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

type Stat = {
  label: string;
  value: string;
  delta: string;
  icon: ComponentType<{ className?: string }>;
};

const STATS: Stat[] = [
  { label: '이번 주 출석', value: '248', delta: '+12 vs 지난주', icon: CalendarCheck },
  { label: '이번 달 헌금', value: '₩ 12.4M', delta: '+8.2% vs 지난달', icon: Wallet },
  { label: '새가족', value: '3', delta: '이번 달', icon: UserPlus },
  { label: '예산 집행률', value: '42%', delta: '회계연도 기준', icon: TrendingUp },
];

const UPCOMING = [
  { time: '11:00', title: '주일 1부 예배', layer: '전체', hue: 165 },
  { time: '13:00', title: '주일 2부 예배', layer: '전체', hue: 165 },
  { time: '14:30', title: '청년부 모임', layer: '청년부', hue: 200 },
  { time: '15:00', title: '찬양팀 연습', layer: '찬양팀', hue: 50 },
];

const RECENT = [
  { who: '김민서', what: '십일조 ₩300,000', when: '12분 전' },
  { who: '이지훈', what: '새가족 등록 완료', when: '1시간 전' },
  { who: '회계', what: '6월 임대료 지출 ₩1,500,000', when: '3시간 전' },
  { who: '박서연', what: '감사헌금 ₩50,000', when: '어제' },
];

export function DashboardPage() {
  const branding = useChurchBranding();
  const today = '2026년 6월 7일 (일)';

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={branding.name}
        title="오늘의 교회 현황"
        description={`${today} · 주요 지표를 한눈에 확인하세요.`}
        actions={
          <>
            <Button variant="outline">
              <CalendarDays />
              주간 보기
            </Button>
            <Button>오늘 입력하기</Button>
          </>
        }
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
        <Card>
          <CardContent className="grid grid-cols-2 gap-0 divide-y divide-[var(--color-border)] p-0 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {STATS.map(stat => (
              <StatCell key={stat.label} stat={stat} />
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        <SectionCard title="오늘의 일정" hint="4건" action="달력 열기" className="lg:col-span-3">
          <ul className="divide-y divide-[var(--color-border)]">
            {UPCOMING.map((schedule, index) => (
              <li key={index} className="flex items-center gap-4 py-3">
                <div className="w-14 text-sm font-medium tabular-nums text-[var(--color-foreground)]">{schedule.time}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{schedule.title}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                    <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: `oklch(0.6 0.14 ${schedule.hue})` }} />
                    {schedule.layer}
                  </div>
                </div>
                <ChevronRight className="size-4 text-[var(--color-muted-foreground)]" />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="최근 활동" hint="실시간" action="모두 보기" className="lg:col-span-2">
          <ul className="space-y-3.5">
            {RECENT.map((activity, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-1 size-2 shrink-0 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{activity.who}</span>
                    <span className="text-[var(--color-muted-foreground)]">{' · '}</span>
                    <span>{activity.what}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">{activity.when}</div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

function StatCell({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-muted-foreground)]">{stat.label}</span>
        <div
          className="flex size-7 items-center justify-center rounded-lg"
          style={{
            backgroundColor: 'color-mix(in oklch, var(--color-primary) 10%, transparent)',
            color: 'var(--color-primary)',
          }}
        >
          <Icon className="size-3.5" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</div>
        <div className="inline-flex items-center gap-0.5 text-xs text-[var(--color-muted-foreground)]">
          <ArrowUpRight className="size-3" style={{ color: 'var(--color-primary)' }} />
          {stat.delta}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  hint,
  action,
  className,
  children,
}: {
  title: string;
  hint?: string;
  action?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            {hint && <span className="text-xs text-[var(--color-muted-foreground)]">{hint}</span>}
          </div>
          {action && (
            <button className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
              {action}
              <ChevronRight className="size-3" />
            </button>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
