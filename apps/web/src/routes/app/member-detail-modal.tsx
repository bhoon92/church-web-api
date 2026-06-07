import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Phone, Plus, X } from 'lucide-react'
import { useState } from 'react'

import {
  assignAffiliation,
  type AffiliationKind,
  endAffiliation,
  setAffiliationLeader,
} from '@/api/affiliations'
import {
  fetchMember,
  type AffiliationSummary,
  type PositionHistoryEntry,
} from '@/api/members'
import { endCurrentPosition, promotePosition } from '@/api/positions'
import { listReferences, REF_LABEL, type Reference } from '@/api/references'
import { STAGE_LABEL, type LifecycleStage } from '@/api/members'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PastoralRecordSection } from './pastoral-record-section'
import { ReceiptSection } from './receipt-section'

const STAGE_TONE: Record<LifecycleStage, 'neutral' | 'muted' | 'success' | 'warn' | 'danger'> = {
  visitor: 'muted',
  new: 'warn',
  regular: 'success',
  transferred: 'muted',
  deceased: 'neutral',
  absent: 'danger',
  anonymous: 'neutral',
}

const KINDS: AffiliationKind[] = ['department', 'ministry', 'smallGroup']

export function MemberDetailModal({
  memberId,
  onClose,
}: {
  memberId: number
  onClose: () => void
}) {
  const { data: member, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => fetchMember(memberId),
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-[var(--color-background)] shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            {isLoading || !member ? (
              <div className="text-sm text-[var(--color-muted-foreground)]">
                불러오는 중…
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {member.name}
                  </h2>
                  <Badge tone={STAGE_TONE[member.lifecycleStage]}>
                    {STAGE_LABEL[member.lifecycleStage]}
                  </Badge>
                </div>
                {member.phone && (
                  <div className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                    <Phone className="size-3" />
                    {member.phone}
                  </div>
                )}
              </>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
            <X />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {member && (
            <>
              <PositionSection
                memberId={memberId}
                current={member.position.current}
                history={member.position.history}
              />

              {KINDS.map((kind) => (
                <AffiliationSection
                  key={kind}
                  kind={kind}
                  memberId={memberId}
                  items={affiliationsByKind(member.affiliations, kind)}
                />
              ))}

              <div className="border-t border-[var(--color-border)] pt-5">
                <PastoralRecordSection memberId={memberId} />
              </div>

              <div className="border-t border-[var(--color-border)] pt-5">
                <ReceiptSection memberId={memberId} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function affiliationsByKind(
  affiliations: {
    departments: AffiliationSummary[]
    ministries: AffiliationSummary[]
    smallGroups: AffiliationSummary[]
  },
  kind: AffiliationKind,
): AffiliationSummary[] {
  switch (kind) {
    case 'department':
      return affiliations.departments
    case 'ministry':
      return affiliations.ministries
    case 'smallGroup':
      return affiliations.smallGroups
  }
}

function AffiliationSection({
  kind,
  memberId,
  items,
}: {
  kind: AffiliationKind
  memberId: number
  items: AffiliationSummary[]
}) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)

  const { data: refs = [] } = useQuery({
    queryKey: ['references', kind],
    queryFn: () => listReferences(kind),
    enabled: adding,
  })

  const assignMut = useMutation({
    mutationFn: (refId: number) => assignAffiliation(memberId, kind, { refId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setAdding(false)
    },
  })

  const endMut = useMutation({
    mutationFn: (refId: number) => endAffiliation(memberId, kind, refId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  const leaderMut = useMutation({
    mutationFn: ({ refId, isLeader }: { refId: number; isLeader: boolean }) =>
      setAffiliationLeader(memberId, kind, refId, isLeader),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  const assignedIds = new Set(items.map((i) => i.refId))
  const available = refs.filter((r: Reference) => !assignedIds.has(r.id))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{REF_LABEL[kind]}</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setAdding(!adding)}
        >
          <Plus className="size-3.5" />
          추가
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && !adding && (
          <span className="text-xs text-[var(--color-muted-foreground)]">
            소속 없음
          </span>
        )}
        {items.map((a) => (
          <AffiliationChip
            key={a.id}
            label={a.refName ?? '(이름 없음)'}
            leader={a.isLeader}
            onToggleLeader={() => leaderMut.mutate({ refId: a.refId, isLeader: !a.isLeader })}
            onRemove={() => endMut.mutate(a.refId)}
          />
        ))}
      </div>

      {adding && (
        <div className="mt-3 rounded-xl border border-dashed border-[var(--color-border)] p-3">
          {available.length === 0 ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              추가 가능한 {REF_LABEL[kind]}이 없습니다. 먼저 설정에서 등록하세요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {available.map((r) => (
                <button
                  key={r.id}
                  onClick={() => assignMut.mutate(r.id)}
                  disabled={assignMut.isPending}
                  className={cn(
                    'rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium',
                    'hover:border-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
                    'transition-colors disabled:opacity-50',
                  )}
                >
                  + {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AffiliationChip({
  label,
  leader,
  onToggleLeader,
  onRemove,
}: {
  label: string
  leader: boolean
  onToggleLeader: () => void
  onRemove: () => void
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
        leader
          ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
          : 'border-[var(--color-border)] bg-[var(--color-background)]',
      )}
    >
      <button
        onClick={onToggleLeader}
        aria-label={leader ? '리더 해제' : '리더 지정'}
        title={leader ? '리더 해제' : '리더 지정'}
        className={cn(
          'text-[10px] leading-none transition-opacity',
          leader ? 'opacity-100' : 'opacity-40 hover:opacity-100',
        )}
      >
        ★
      </button>
      {label}
      <button
        onClick={onRemove}
        className={cn(
          'rounded-full p-0.5 transition-colors',
          leader
            ? 'hover:bg-white/15'
            : 'hover:bg-[var(--color-muted)]',
        )}
        aria-label="종료"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

function PositionSection({
  memberId,
  current,
  history,
}: {
  memberId: number
  current: PositionHistoryEntry | null
  history: PositionHistoryEntry[]
}) {
  const queryClient = useQueryClient()
  const [picking, setPicking] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const { data: positions = [] } = useQuery({
    queryKey: ['references', 'position'],
    queryFn: () => listReferences('position'),
    enabled: picking,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['member', memberId] })
    queryClient.invalidateQueries({ queryKey: ['members'] })
  }

  const promoteMut = useMutation({
    mutationFn: (positionId: number) =>
      promotePosition(memberId, { positionId }),
    onSuccess: () => {
      invalidate()
      setPicking(false)
    },
  })

  const endMut = useMutation({
    mutationFn: () => endCurrentPosition(memberId),
    onSuccess: invalidate,
  })

  const previousHistory = history.filter((h) => !h.isCurrent)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">직분</h3>
        <Button size="sm" variant="ghost" onClick={() => setPicking(!picking)}>
          <Plus className="size-3.5" />
          {current ? '변경' : '임명'}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {current ? (
          <>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-foreground)] bg-[var(--color-foreground)] px-3 py-1 text-xs font-medium text-[var(--color-background)]"
            >
              {current.positionName ?? '(이름 없음)'}
            </span>
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {current.startDate} ~
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (window.confirm('현재 직분을 종료할까요?')) endMut.mutate()
              }}
              className="text-xs text-[var(--color-muted-foreground)]"
            >
              종료
            </Button>
          </>
        ) : (
          <span className="text-xs text-[var(--color-muted-foreground)]">
            현재 직분 없음
          </span>
        )}
      </div>

      {picking && (
        <div className="mt-3 rounded-xl border border-dashed border-[var(--color-border)] p-3">
          {positions.length === 0 ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              등록된 직분이 없습니다. 먼저 설정에서 등록하세요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {positions
                .filter((p: Reference) => p.id !== current?.positionId)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => promoteMut.mutate(p.id)}
                    disabled={promoteMut.isPending}
                    className={cn(
                      'rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium',
                      'hover:border-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
                      'transition-colors disabled:opacity-50',
                    )}
                  >
                    → {p.name}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {previousHistory.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            {showHistory ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            이전 직분 ({previousHistory.length})
          </button>

          {showHistory && (
            <ul className="mt-2 space-y-1 pl-4 text-xs text-[var(--color-muted-foreground)]">
              {previousHistory.map((h) => (
                <li key={h.id}>
                  {h.positionName ?? '(이름 없음)'} ·{' '}
                  <span className="tabular-nums">
                    {h.startDate} ~ {h.endDate}
                  </span>
                  {h.note && <span> · {h.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
