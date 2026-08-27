import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, GraduationCap, Plus, Settings2, X } from 'lucide-react';
import { useState } from 'react';

import { listMembers, type Member } from '@/api/members';
import {
  COHORT_STATUS_LABEL,
  ENROLLMENT_STATUS_LABEL,
  TRAINING_FORMAT_LABEL,
  createCohort,
  enrollMembers,
  fetchCohortDetail,
  listCohorts,
  listCourses,
  markTrainingAttendance,
  updateCohort,
  updateEnrollmentStatus,
  updateSession,
  type Cohort,
  type CohortStatus,
} from '@/api/training';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { todayString } from '@/lib/date';
import { usePermissions } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { CourseManagerModal } from './course-manager';

const STATUS_TONE: Record<CohortStatus, 'neutral' | 'muted' | 'success' | 'warn'> = {
  planned: 'neutral',
  ongoing: 'success',
  closed: 'muted',
};

const STATUS_FILTERS: (CohortStatus | 'all')[] = ['all', 'ongoing', 'planned', 'closed'];

export function TrainingPage() {
  const { can } = usePermissions();
  const canWrite = can('training:write');
  const [statusFilter, setStatusFilter] = useState<CohortStatus | 'all'>('all');
  const [openCohortId, setOpenCohortId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [managingCourses, setManagingCourses] = useState(false);

  const { data: courses = [] } = useQuery({ queryKey: ['training', 'courses'], queryFn: listCourses });
  const { data: cohorts = [], isLoading } = useQuery({
    queryKey: ['training', 'cohorts', statusFilter],
    queryFn: () => listCohorts(statusFilter === 'all' ? undefined : { status: statusFilter }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="양성"
        title="훈련"
        description="과정별 기수를 열고 회차 출석과 수료를 관리합니다."
        actions={
          canWrite && (
            <>
              <Button size="sm" variant="outline" onClick={() => setManagingCourses(true)}>
                <Settings2 className="size-4" />
                과정 관리
              </Button>
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                기수 개설
              </Button>
            </>
          )
        }
      />

      {managingCourses && <CourseManagerModal onClose={() => setManagingCourses(false)} />}

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === filter
                ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
                : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]'
            )}
          >
            {filter === 'all' ? '전체' : COHORT_STATUS_LABEL[filter]}
          </button>
        ))}
      </div>

      {creating && <CohortForm courses={courses} onClose={() => setCreating(false)} />}

      {isLoading ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">불러오는 중…</p>
      ) : cohorts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <GraduationCap className="size-8 text-[var(--color-muted-foreground)]" />
            <p className="text-sm text-[var(--color-muted-foreground)]">아직 개설된 기수가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {cohorts.map(cohort => (
            <button key={cohort.id} onClick={() => setOpenCohortId(cohort.id)} className="text-left">
              <Card className="h-full transition-colors hover:border-[var(--color-foreground)]">
                <CardContent className="space-y-2 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{cohort.label}</p>
                    <Badge tone={STATUS_TONE[cohort.status]}>{COHORT_STATUS_LABEL[cohort.status]}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {cohort.startDate}
                    {cohort.endDate ? ` ~ ${cohort.endDate}` : ''}
                    {cohort.leaderName ? ` · 담당 ${cohort.leaderName}` : ''}
                  </p>
                  <p className="text-sm tabular-nums">
                    수강 {cohort.enrolledCount}명 · 수료 {cohort.completedCount}명 · {cohort.sessionCount}회차
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {openCohortId !== null && (
        <CohortDetailModal cohort={cohorts.find(item => item.id === openCohortId)!} onClose={() => setOpenCohortId(null)} />
      )}
    </div>
  );
}

function CohortForm({
  courses,
  onClose,
}: {
  courses: { id: number; name: string; format: string; defaultSessionCount: number }[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState<number | null>(courses[0]?.id ?? null);
  const [startDate, setStartDate] = useState(todayString());
  const [sessionCount, setSessionCount] = useState<string>('');

  const createMut = useMutation({
    mutationFn: () =>
      createCohort({
        courseId: courseId!,
        startDate,
        sessionCount: sessionCount ? Number(sessionCount) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training', 'cohorts'] });
      onClose();
    },
  });

  const selected = courses.find(course => course.id === courseId);

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap gap-1.5">
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => setCourseId(course.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                courseId === course.id
                  ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]'
              )}
            >
              {course.name}
              <span className="ml-1 opacity-60">
                {TRAINING_FORMAT_LABEL[course.format as keyof typeof TRAINING_FORMAT_LABEL] ?? course.format}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} className="w-40" />
          <Input
            type="number"
            min={1}
            placeholder={selected ? `회차 (기본 ${selected.defaultSessionCount})` : '회차'}
            value={sessionCount}
            onChange={event => setSessionCount(event.target.value)}
            className="w-44"
          />
        </div>

        <p className="text-xs text-[var(--color-muted-foreground)]">
          기수 번호는 자동으로 매겨지고, 회차가 함께 생성됩니다. 날짜·주제는 개설 후 채우면 됩니다.
        </p>

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" onClick={() => createMut.mutate()} disabled={!courseId || createMut.isPending}>
            개설
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CohortDetailModal({ cohort, onClose }: { cohort: Cohort; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canWrite = can('training:write');
  const [enrolling, setEnrolling] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['training', 'cohort', cohort.id],
    queryFn: () => fetchCohortDetail(cohort.id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['training', 'cohort', cohort.id] });
    queryClient.invalidateQueries({ queryKey: ['training', 'cohorts'] });
    queryClient.invalidateQueries({ queryKey: ['home', 'dashboard'] });
  };

  const attendanceMut = useMutation({
    mutationFn: (vars: { sessionId: number; enrollmentId: number; present: boolean }) =>
      markTrainingAttendance(vars.sessionId, vars.enrollmentId, vars.present),
    onSuccess: invalidate,
  });

  const completeMut = useMutation({
    mutationFn: (enrollmentId: number) => updateEnrollmentStatus(enrollmentId, 'completed'),
    onSuccess: invalidate,
  });

  const statusMut = useMutation({
    mutationFn: (status: CohortStatus) => updateCohort(cohort.id, { status }),
    onSuccess: invalidate,
  });

  const sessionMut = useMutation({
    mutationFn: (vars: { sessionId: number; date: string }) => updateSession(vars.sessionId, { date: vars.date }),
    onSuccess: invalidate,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-[var(--color-background)] shadow-md"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{cohort.label}</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {cohort.startDate}
              {cohort.endDate ? ` ~ ${cohort.endDate}` : ''} · 수강 {cohort.enrolledCount}명
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
            <X />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-auto px-6 py-5">
          {canWrite && (
            <div className="flex flex-wrap items-center gap-2">
              {(['planned', 'ongoing', 'closed'] as CohortStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => statusMut.mutate(status)}
                  disabled={status === cohort.status}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    status === cohort.status
                      ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]'
                  )}
                >
                  {COHORT_STATUS_LABEL[status]}
                </button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setEnrolling(!enrolling)}>
                <Plus className="size-3.5" />
                수강생 추가
              </Button>
            </div>
          )}

          {enrolling && (
            <EnrollPanel
              cohortId={cohort.id}
              onDone={() => {
                invalidate();
                setEnrolling(false);
              }}
            />
          )}

          {isLoading || !detail ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">불러오는 중…</p>
          ) : detail.roster.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">아직 수강생이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="py-2 pr-3 text-left font-medium">수강생</th>
                    {detail.sessions.map(session => (
                      <th key={session.id} className="px-1 py-2 text-center font-medium">
                        <div className="tabular-nums">{session.sequence}</div>
                        {canWrite ? (
                          <input
                            type="date"
                            value={session.date ?? ''}
                            onChange={event => sessionMut.mutate({ sessionId: session.id, date: event.target.value })}
                            className="mt-1 w-[7.5rem] rounded border border-[var(--color-border)] px-1 py-0.5 text-[10px]"
                          />
                        ) : (
                          <div className="text-[10px] text-[var(--color-muted-foreground)]">{session.date ?? '-'}</div>
                        )}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-right font-medium">출석률</th>
                    <th className="py-2 pl-2 text-right font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.roster.map(row => (
                    <tr key={row.enrollmentId} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">{row.memberName}</td>
                      {detail.sessions.map(session => {
                        const present = row.attendedSessionIds.includes(session.id);
                        return (
                          <td key={session.id} className="px-1 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={present}
                              disabled={!canWrite || attendanceMut.isPending}
                              onChange={() =>
                                attendanceMut.mutate({
                                  sessionId: session.id,
                                  enrollmentId: row.enrollmentId,
                                  present: !present,
                                })
                              }
                              className="size-4 accent-[var(--color-foreground)]"
                            />
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-right tabular-nums">{row.attendanceRate}%</td>
                      <td className="py-2 pl-2 text-right">
                        {row.status === 'completed' ? (
                          <Badge tone="success">{ENROLLMENT_STATUS_LABEL.completed}</Badge>
                        ) : canWrite ? (
                          <Button size="sm" variant="ghost" onClick={() => completeMut.mutate(row.enrollmentId)}>
                            <CheckCircle2 className="size-3.5" />
                            수료
                          </Button>
                        ) : (
                          <Badge tone="muted">{ENROLLMENT_STATUS_LABEL[row.status]}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-[var(--color-muted-foreground)]">출석률은 참고용입니다. 수료는 담당자가 직접 확정합니다.</p>
        </div>
      </div>
    </div>
  );
}

function EnrollPanel({ cohortId, onDone }: { cohortId: number; onDone: () => void }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  const { data } = useQuery({
    queryKey: ['members', 'for-enroll', query],
    queryFn: () => listMembers({ q: query || undefined, pageSize: 20 }),
  });

  const enrollMut = useMutation({
    mutationFn: () => enrollMembers(cohortId, selected),
    onSuccess: onDone,
  });

  const items: Member[] = data?.items ?? [];

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <Input placeholder="이름으로 검색" value={query} onChange={event => setQuery(event.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {items.map(member => {
            const picked = selected.includes(member.id);
            return (
              <button
                key={member.id}
                onClick={() => setSelected(picked ? selected.filter(id => id !== member.id) : [...selected, member.id])}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  picked
                    ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]'
                )}
              >
                {member.name}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => enrollMut.mutate()} disabled={selected.length === 0 || enrollMut.isPending}>
            {selected.length}명 등록
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
