import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Phone, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { assignAffiliation, type AffiliationKind, endAffiliation, setAffiliationLeader } from '@/api/affiliations';
import { fetchMember, type AffiliationSummary, type PositionHistoryEntry } from '@/api/members';
import { endCurrentPosition, promotePosition } from '@/api/positions';
import { listReferences, REFERENCE_LABEL, type Reference } from '@/api/references';
import { STAGE_LABEL, type LifecycleStage } from '@/api/members';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/permissions';
import { PastoralRecordSection } from './pastoral-record-section';
import { ReceiptSection } from './receipt-section';

const STAGE_TONE: Record<LifecycleStage, 'neutral' | 'muted' | 'success' | 'warn' | 'danger'> = {
  visitor: 'muted',
  new: 'warn',
  regular: 'success',
  transferred: 'muted',
  deceased: 'neutral',
  absent: 'danger',
  anonymous: 'neutral',
};

const KINDS: AffiliationKind[] = ['department', 'ministry', 'smallGroup'];

export function MemberDetailModal({ memberId, onClose }: { memberId: number; onClose: () => void }) {
  const { data: member, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => fetchMember(memberId),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-[var(--color-background)] shadow-md"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            {isLoading || !member ? (
              <div className="text-sm text-[var(--color-muted-foreground)]">불러오는 중…</div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">{member.name}</h2>
                  <Badge tone={STAGE_TONE[member.lifecycleStage]}>{STAGE_LABEL[member.lifecycleStage]}</Badge>
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
              <PositionSection memberId={memberId} current={member.position.current} history={member.position.history} />

              {KINDS.map(kind => (
                <AffiliationSection key={kind} kind={kind} memberId={memberId} items={affiliationsByKind(member.affiliations, kind)} />
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
  );
}

function affiliationsByKind(
  affiliations: {
    departments: AffiliationSummary[];
    ministries: AffiliationSummary[];
    smallGroups: AffiliationSummary[];
  },
  kind: AffiliationKind
): AffiliationSummary[] {
  switch (kind) {
    case 'department':
      return affiliations.departments;
    case 'ministry':
      return affiliations.ministries;
    case 'smallGroup':
      return affiliations.smallGroups;
  }
}

function AffiliationSection({ kind, memberId, items }: { kind: AffiliationKind; memberId: number; items: AffiliationSummary[] }) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canWrite = can('member:write');
  const [adding, setAdding] = useState(false);
  const currentYear = new Date().getFullYear();

  const { data: references = [] } = useQuery({
    queryKey: ['references', kind, currentYear],
    queryFn: () => listReferences(kind, currentYear),
    enabled: adding,
  });

  const assignMut = useMutation({
    mutationFn: (referenceId: number) => assignAffiliation(memberId, kind, { referenceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setAdding(false);
    },
  });

  const endMut = useMutation({
    mutationFn: (referenceId: number) => endAffiliation(memberId, kind, referenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const leaderMut = useMutation({
    mutationFn: ({ referenceId, isLeader }: { referenceId: number; isLeader: boolean }) => setAffiliationLeader(memberId, kind, referenceId, isLeader),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const assignedIds = new Set(items.map(item => item.referenceId));
  const available = references.filter((reference: Reference) => !assignedIds.has(reference.id));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{REFERENCE_LABEL[kind]}</h3>
        {canWrite && (
          <Button size="sm" variant="ghost" onClick={() => setAdding(!adding)}>
            <Plus className="size-3.5" />
            추가
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && !adding && <span className="text-xs text-[var(--color-muted-foreground)]">소속 없음</span>}
        {items.map(affiliation => (
          <AffiliationChip
            key={affiliation.id}
            label={affiliation.referenceName ?? '(이름 없음)'}
            leader={affiliation.isLeader}
            canWrite={canWrite}
            onToggleLeader={() => leaderMut.mutate({ referenceId: affiliation.referenceId, isLeader: !affiliation.isLeader })}
            onRemove={() => endMut.mutate(affiliation.referenceId)}
          />
        ))}
      </div>

      {adding && (
        <div className="mt-3 rounded-xl border border-dashed border-[var(--color-border)] p-3">
          {available.length === 0 ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              추가 가능한 {REFERENCE_LABEL[kind]}이 없습니다. 먼저 설정에서 등록하세요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {available.map(reference => (
                <button
                  key={reference.id}
                  onClick={() => assignMut.mutate(reference.id)}
                  disabled={assignMut.isPending}
                  className={cn(
                    'rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium',
                    'hover:border-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
                    'transition-colors disabled:opacity-50'
                  )}
                >
                  + {reference.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AffiliationChip({
  label,
  leader,
  canWrite,
  onToggleLeader,
  onRemove,
}: {
  label: string;
  leader: boolean;
  canWrite: boolean;
  onToggleLeader: () => void;
  onRemove: () => void;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
        leader
          ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
          : 'border-[var(--color-border)] bg-[var(--color-background)]'
      )}
    >
      {canWrite ? (
        <button
          onClick={onToggleLeader}
          aria-label={leader ? '리더 해제' : '리더 지정'}
          title={leader ? '리더 해제' : '리더 지정'}
          className={cn('text-[10px] leading-none transition-opacity', leader ? 'opacity-100' : 'opacity-40 hover:opacity-100')}
        >
          ★
        </button>
      ) : (
        leader && <span className="text-[10px] leading-none">★</span>
      )}
      {label}
      {canWrite && (
        <button
          onClick={onRemove}
          className={cn('rounded-full p-0.5 transition-colors', leader ? 'hover:bg-white/15' : 'hover:bg-[var(--color-muted)]')}
          aria-label="종료"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

function PositionSection({
  memberId,
  current,
  history,
}: {
  memberId: number;
  current: PositionHistoryEntry | null;
  history: PositionHistoryEntry[];
}) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canWrite = can('member:write');
  const [picking, setPicking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: positions = [] } = useQuery({
    queryKey: ['references', 'position'],
    queryFn: () => listReferences('position'),
    enabled: picking,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['member', memberId] });
    queryClient.invalidateQueries({ queryKey: ['members'] });
  };

  const promoteMut = useMutation({
    mutationFn: (positionId: number) => promotePosition(memberId, { positionId }),
    onSuccess: () => {
      invalidate();
      setPicking(false);
    },
  });

  const endMut = useMutation({
    mutationFn: () => endCurrentPosition(memberId),
    onSuccess: invalidate,
  });

  const previousHistory = history.filter(historyRecord => !historyRecord.isCurrent);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">직분</h3>
        {canWrite && (
          <Button size="sm" variant="ghost" onClick={() => setPicking(!picking)}>
            <Plus className="size-3.5" />
            {current ? '변경' : '임명'}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {current ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-foreground)] bg-[var(--color-foreground)] px-3 py-1 text-xs font-medium text-[var(--color-background)]">
              {current.positionName ?? '(이름 없음)'}
            </span>
            <span className="text-xs text-[var(--color-muted-foreground)]">{current.startDate} ~</span>
            {canWrite && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm('현재 직분을 종료할까요?')) endMut.mutate();
                }}
                className="text-xs text-[var(--color-muted-foreground)]"
              >
                종료
              </Button>
            )}
          </>
        ) : (
          <span className="text-xs text-[var(--color-muted-foreground)]">현재 직분 없음</span>
        )}
      </div>

      {picking && (
        <div className="mt-3 rounded-xl border border-dashed border-[var(--color-border)] p-3">
          {positions.length === 0 ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">등록된 직분이 없습니다. 먼저 설정에서 등록하세요.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {positions
                .filter((position: Reference) => position.id !== current?.positionId)
                .map(position => (
                  <button
                    key={position.id}
                    onClick={() => promoteMut.mutate(position.id)}
                    disabled={promoteMut.isPending}
                    className={cn(
                      'rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium',
                      'hover:border-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
                      'transition-colors disabled:opacity-50'
                    )}
                  >
                    → {position.name}
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
            {showHistory ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            이전 직분 ({previousHistory.length})
          </button>

          {showHistory && (
            <ul className="mt-2 space-y-1 pl-4 text-xs text-[var(--color-muted-foreground)]">
              {previousHistory.map(historyRecord => (
                <li key={historyRecord.id}>
                  {historyRecord.positionName ?? '(이름 없음)'} ·{' '}
                  <span className="tabular-nums">
                    {historyRecord.startDate} ~ {historyRecord.endDate}
                  </span>
                  {historyRecord.note && <span> · {historyRecord.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
