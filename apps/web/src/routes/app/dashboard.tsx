import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronRight, GraduationCap, Globe2, PlaneTakeoff, Sprout } from 'lucide-react';
import { motion } from 'motion/react';
import type { ComponentType } from 'react';
import { Link } from 'react-router';

import { fetchHomeDashboard, type HomeActivityItem, type HomeScheduleItem } from '@/api/dashboard';
import { useChurchBranding } from '@/branding/church-branding';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

type Stat = {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
};

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function formatToday(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_LABELS[date.getDay()]})`;
}

function formatTime(item: HomeScheduleItem): string {
  if (item.allDay) return '종일';
  const d = new Date(item.startAt);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

const ACTIVITY_DOT: Record<HomeActivityItem['kind'], string> = {
  training: 'oklch(0.65 0.15 150)',
  missionary: 'oklch(0.62 0.19 260)',
  offering: 'var(--color-primary)',
  member: 'oklch(0.7 0.1 200)',
  transaction: 'oklch(0.7 0.13 60)',
};

export function DashboardPage() {
  const branding = useChurchBranding();
  const today = formatToday(new Date());

  const { data } = useQuery({
    queryKey: ['home', 'dashboard'],
    queryFn: fetchHomeDashboard,
  });

  const placeholder = data === undefined;
  const stats: Stat[] = [
    { label: '현재 파송', value: placeholder ? '—' : `${data.stats.activeMissionaries}명`, icon: Globe2 },
    { label: '올해 파송 확정', value: placeholder ? '—' : `${data.stats.commissionedThisYear}명`, icon: PlaneTakeoff },
    { label: '진행 중 훈련', value: placeholder ? '—' : `${data.stats.ongoingCohorts}개 기수`, icon: GraduationCap },
    { label: '올해 수료', value: placeholder ? '—' : `${data.stats.completedThisYear}명`, icon: Sprout },
  ];
  const pipeline = data?.pipeline ?? [];
  const training = data?.training ?? [];
  const schedule = data?.schedule ?? [];
  const activity = data?.activity ?? [];
  const pipelineTotal = pipeline.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={branding.name}
        title="양성 현황"
        description={`${today} · 훈련과 파송을 한눈에 확인하세요.`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/calendar">
                <CalendarDays />
                달력 보기
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/training">훈련 관리</Link>
            </Button>
          </>
        }
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
        <Card>
          <CardContent className="grid grid-cols-2 gap-0 divide-y divide-[var(--color-border)] p-0 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {stats.map(stat => (
              <StatCell key={stat.label} stat={stat} />
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        <SectionCard
          title="양성 파이프라인"
          hint={`총 ${pipelineTotal}명`}
          actionLabel="교인 보기"
          actionTo="/app/members"
          className="lg:col-span-3"
        >
          {pipeline.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">등록된 교인이 없습니다.</p>
          ) : (
            <ul className="space-y-2.5">
              {pipeline.map(stage => (
                <li key={stage.statusId} className="flex items-center gap-3">
                  <div className="w-16 shrink-0 text-xs text-[var(--color-muted-foreground)]">{stage.name}</div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)]"
                      style={{ width: pipelineTotal === 0 ? '0%' : `${Math.round((stage.count / pipelineTotal) * 100)}%` }}
                    />
                  </div>
                  <div className="w-10 shrink-0 text-right text-sm font-medium tabular-nums">{stage.count}</div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="진행 중 훈련" hint={`${training.length}개 기수`} actionLabel="훈련 열기" actionTo="/app/training" className="lg:col-span-2">
          {training.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">진행 중인 기수가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {training.map(cohort => (
                <li key={cohort.cohortId} className="py-2.5">
                  <div className="text-sm font-medium">{cohort.label}</div>
                  <div className="mt-0.5 text-xs tabular-nums text-[var(--color-muted-foreground)]">
                    {cohort.startDate} · 수강 {cohort.enrolledCount}명 · {cohort.sessionCount}회차
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <SectionCard title="오늘의 일정" hint={`${schedule.length}건`} actionLabel="달력 열기" actionTo="/app/calendar" className="lg:col-span-3">
          {schedule.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">오늘 예정된 일정이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {schedule.map(item => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  <div className="w-14 text-sm font-medium tabular-nums text-[var(--color-foreground)]">{formatTime(item)}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                      <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.layer}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-[var(--color-muted-foreground)]" />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="최근 활동" hint="실시간" className="lg:col-span-2">
          {activity.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">최근 활동이 없습니다.</p>
          ) : (
            <ul className="space-y-3.5">
              {activity.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1 size-2 shrink-0 rounded-full" style={{ backgroundColor: ACTIVITY_DOT[item.kind] }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      <span className="font-medium">{item.who}</span>
                      <span className="text-[var(--color-muted-foreground)]">{' · '}</span>
                      <span>{item.what}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">{timeAgo(item.at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</div>
    </div>
  );
}

function SectionCard({
  title,
  hint,
  actionLabel,
  actionTo,
  className,
  children,
}: {
  title: string;
  hint?: string;
  actionLabel?: string;
  actionTo?: string;
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
          {actionLabel && actionTo && (
            <Link
              to={actionTo}
              className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              {actionLabel}
              <ChevronRight className="size-3" />
            </Link>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
