import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import {
  changeMissionaryStage,
  createMissionary,
  fetchMissionaryByMember,
  MISSIONARY_STAGE_LABEL,
  MISSIONARY_STAGES,
  type MissionaryStage,
} from '@/api/missionary'
import { ENROLLMENT_STATUS_LABEL, fetchMemberTrainingHistory, type EnrollmentStatus } from '@/api/training'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/lib/permissions'

const STATUS_TONE: Record<EnrollmentStatus, 'neutral' | 'muted' | 'success' | 'warn'> = {
  enrolled: 'warn',
  completed: 'success',
  dropped: 'muted',
}

/**
 * 교인 한 명의 양성 경로 — 무엇을 통과했고(훈련 이력) 지금 어디까지 갔는지(파송 단계).
 * 이 교회의 핵심 화면이라 교인 상세의 맨 위에 둔다.
 */
export function MemberJourneySection({ memberId }: { memberId: number }) {
  return (
    <div className="space-y-5">
      <TrainingHistory memberId={memberId} />
      <MissionaryTrack memberId={memberId} />
    </div>
  )
}

function TrainingHistory({ memberId }: { memberId: number }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['training-history', memberId],
    queryFn: () => fetchMemberTrainingHistory(memberId),
  })

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">훈련 이력</h3>
      {isLoading ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">불러오는 중…</p>
      ) : history.length === 0 ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">수강 이력 없음</p>
      ) : (
        <ul className="space-y-2">
          {history.map((item) => (
            <li
              key={item.enrollmentId}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.label}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {item.enrolledAt}
                  {item.closedAt ? ` → ${item.closedAt}` : ''} · 출석 {item.attendanceRate}%
                </p>
              </div>
              <Badge tone={STATUS_TONE[item.status]}>{ENROLLMENT_STATUS_LABEL[item.status]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MissionaryTrack({ memberId }: { memberId: number }) {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const canWrite = can('missionary:write')
  const [note, setNote] = useState('')

  const { data: missionary, isLoading } = useQuery({
    queryKey: ['missionary', 'by-member', memberId],
    queryFn: () => fetchMissionaryByMember(memberId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['missionary', 'by-member', memberId] })
    queryClient.invalidateQueries({ queryKey: ['missionaries'] })
    queryClient.invalidateQueries({ queryKey: ['member', memberId] })
    queryClient.invalidateQueries({ queryKey: ['home', 'dashboard'] })
  }

  const registerMut = useMutation({
    mutationFn: () => createMissionary({ memberId }),
    onSuccess: invalidate,
  })

  const stageMut = useMutation({
    mutationFn: (stage: MissionaryStage) => changeMissionaryStage(missionary!.id, stage, note.trim() || undefined),
    onSuccess: () => {
      setNote('')
      invalidate()
    },
  })

  if (isLoading) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-semibold">파송 트랙</h3>
        <p className="text-xs text-[var(--color-muted-foreground)]">불러오는 중…</p>
      </div>
    )
  }

  if (!missionary) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">파송 트랙</h3>
          {canWrite && (
            <Button size="sm" variant="ghost" onClick={() => registerMut.mutate()} disabled={registerMut.isPending}>
              <Plus className="size-3.5" />
              트랙 등록
            </Button>
          )}
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">파송 트랙에 등록되지 않은 교인입니다.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">파송 트랙</h3>
        <Badge tone="success">{MISSIONARY_STAGE_LABEL[missionary.stage]}</Badge>
      </div>

      {(missionary.country || missionary.fieldWork) && (
        <p className="mb-2 text-xs text-[var(--color-muted-foreground)]">
          {[missionary.country, missionary.region].filter(Boolean).join(' ')}
          {missionary.fieldWork ? ` · ${missionary.fieldWork}` : ''}
        </p>
      )}

      {canWrite && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {MISSIONARY_STAGES.map((stage) => (
              <button
                key={stage}
                onClick={() => stageMut.mutate(stage)}
                disabled={stage === missionary.stage || stageMut.isPending}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  stage === missionary.stage
                    ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]',
                )}
              >
                {MISSIONARY_STAGE_LABEL[stage]}
              </button>
            ))}
          </div>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="단계 변경 메모 (선택)"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-xs outline-none focus:border-[var(--color-foreground)]"
          />
          <p className="text-[11px] text-[var(--color-muted-foreground)]">
            파송 단계로 옮기면 재적상태가 자동으로 “파송”이 되어 출석 명단에서 빠집니다.
          </p>
        </div>
      )}
    </div>
  )
}
