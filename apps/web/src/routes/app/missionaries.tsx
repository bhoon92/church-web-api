import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Globe2, Plus, X } from 'lucide-react'
import { useState } from 'react'

import { listMembers, type Member } from '@/api/members'
import {
  ACTIVE_STAGES,
  MISSIONARY_STAGE_LABEL,
  MISSIONARY_STAGES,
  changeMissionaryStage,
  createMissionary,
  fetchMissionaryDetail,
  fetchMissionarySummary,
  listMissionaries,
  updateMissionary,
  type Missionary,
  type MissionaryStage,
} from '@/api/missionary'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { usePermissions } from '@/lib/permissions'
import { cn } from '@/lib/utils'

const STAGE_TONE: Record<MissionaryStage, 'neutral' | 'muted' | 'success' | 'warn'> = {
  candidate: 'neutral',
  training: 'warn',
  commissioned: 'success',
  field: 'success',
  furlough: 'warn',
  returned: 'muted',
  ended: 'muted',
}

export function MissionariesPage() {
  const { can } = usePermissions()
  const canWrite = can('missionary:write')
  const [stageFilter, setStageFilter] = useState<MissionaryStage | 'active' | 'all'>('active')
  const [openId, setOpenId] = useState<number | null>(null)
  const [registering, setRegistering] = useState(false)

  const { data: summary } = useQuery({ queryKey: ['missionaries', 'summary'], queryFn: fetchMissionarySummary })
  const { data: missionaries = [], isLoading } = useQuery({
    queryKey: ['missionaries', stageFilter],
    queryFn: () =>
      listMissionaries(
        stageFilter === 'all' ? { scope: 'all' } : stageFilter === 'active' ? { scope: 'active' } : { stage: stageFilter },
      ),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="양성"
        title="선교사"
        description="파송 트랙의 단계별 현황입니다. 단계를 옮기면 이력이 남습니다."
        actions={
          canWrite && (
            <Button size="sm" onClick={() => setRegistering(true)}>
              <Plus className="size-4" />
              트랙 등록
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="현재 파송" value={summary ? `${summary.active}명` : '—'} />
        <StatTile label="올해 파송 확정" value={summary ? `${summary.commissionedThisYear}명` : '—'} />
        <StatTile
          label="후보·훈련"
          value={summary ? `${summary.byStage.candidate + summary.byStage.training}명` : '—'}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={stageFilter === 'active'} onClick={() => setStageFilter('active')}>
          파송 중
        </FilterChip>
        <FilterChip active={stageFilter === 'all'} onClick={() => setStageFilter('all')}>
          전체
        </FilterChip>
        {MISSIONARY_STAGES.map((stage) => (
          <FilterChip key={stage} active={stageFilter === stage} onClick={() => setStageFilter(stage)}>
            {MISSIONARY_STAGE_LABEL[stage]}
            {summary ? ` ${summary.byStage[stage]}` : ''}
          </FilterChip>
        ))}
      </div>

      {registering && <RegisterPanel onClose={() => setRegistering(false)} />}

      {isLoading ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">불러오는 중…</p>
      ) : missionaries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Globe2 className="size-8 text-[var(--color-muted-foreground)]" />
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {stageFilter === 'active' ? '현재 파송 중인 선교사가 없습니다.' : '해당 단계의 선교사가 없습니다.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {missionaries.map((missionary) => (
            <button key={missionary.id} onClick={() => setOpenId(missionary.id)} className="text-left">
              <Card className="h-full transition-colors hover:border-[var(--color-foreground)]">
                <CardContent className="space-y-1.5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{missionary.memberName}</p>
                    <Badge tone={STAGE_TONE[missionary.stage]}>{MISSIONARY_STAGE_LABEL[missionary.stage]}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {[missionary.country, missionary.region].filter(Boolean).join(' ') || '파송지 미정'}
                  </p>
                  {missionary.fieldWork && <p className="truncate text-sm">{missionary.fieldWork}</p>}
                  {missionary.commissionedAt && (
                    <p className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
                      파송 {missionary.commissionedAt}
                    </p>
                  )}
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {openId !== null && <MissionaryDetailModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
          : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]',
      )}
    >
      {children}
    </button>
  )
}

function RegisterPanel({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Member | null>(null)

  const { data } = useQuery({
    queryKey: ['members', 'for-missionary', query],
    queryFn: () => listMembers({ q: query || undefined, pageSize: 20 }),
  })

  const createMut = useMutation({
    mutationFn: () => createMissionary({ memberId: picked!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missionaries'] })
      onClose()
    },
  })

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <Input placeholder="교인 이름으로 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {(data?.items ?? []).map((member) => (
            <FilterChip key={member.id} active={picked?.id === member.id} onClick={() => setPicked(member)}>
              {member.name}
            </FilterChip>
          ))}
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">후보(candidate) 단계로 등록됩니다.</p>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" onClick={() => createMut.mutate()} disabled={!picked || createMut.isPending}>
            등록
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MissionaryDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const canWrite = can('missionary:write')
  const [note, setNote] = useState('')

  const { data: missionary, isLoading } = useQuery({
    queryKey: ['missionary', id],
    queryFn: () => fetchMissionaryDetail(id),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['missionary', id] })
    queryClient.invalidateQueries({ queryKey: ['missionaries'] })
    queryClient.invalidateQueries({ queryKey: ['home', 'dashboard'] })
  }

  const stageMut = useMutation({
    mutationFn: (stage: MissionaryStage) => changeMissionaryStage(id, stage, note.trim() || undefined),
    onSuccess: () => {
      setNote('')
      invalidate()
    },
  })

  const fieldMut = useMutation({
    mutationFn: (payload: { country?: string; region?: string; fieldWork?: string }) => updateMissionary(id, payload),
    onSuccess: invalidate,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-[var(--color-background)] shadow-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{missionary?.memberName ?? '불러오는 중…'}</h2>
            {missionary && (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {MISSIONARY_STAGE_LABEL[missionary.stage]}
                {ACTIVE_STAGES.includes(missionary.stage) ? ' · 출석 명단 제외' : ''}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
            <X />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-auto px-6 py-5">
          {isLoading || !missionary ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">불러오는 중…</p>
          ) : (
            <>
              <FieldEditor missionary={missionary} canWrite={canWrite} onSave={(payload) => fieldMut.mutate(payload)} />

              {canWrite && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">단계 이동</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {MISSIONARY_STAGES.map((stage) => (
                      <FilterChip
                        key={stage}
                        active={stage === missionary.stage}
                        onClick={() => stage !== missionary.stage && stageMut.mutate(stage)}
                      >
                        {MISSIONARY_STAGE_LABEL[stage]}
                      </FilterChip>
                    ))}
                  </div>
                  <Input placeholder="변경 메모 (선택)" value={note} onChange={(event) => setNote(event.target.value)} />
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-semibold">단계 이력</h3>
                {missionary.history.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted-foreground)]">이력 없음</p>
                ) : (
                  <ul className="space-y-2">
                    {missionary.history.map((entry) => (
                      <li key={entry.id} className="rounded-xl border border-[var(--color-border)] px-3 py-2">
                        <p className="text-sm">
                          {entry.fromStage ? `${MISSIONARY_STAGE_LABEL[entry.fromStage]} → ` : ''}
                          <span className="font-medium">{MISSIONARY_STAGE_LABEL[entry.toStage]}</span>
                        </p>
                        <p className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
                          {entry.changedAt}
                          {entry.note ? ` · ${entry.note}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FieldEditor({
  missionary,
  canWrite,
  onSave,
}: {
  missionary: Missionary
  canWrite: boolean
  onSave: (payload: { country?: string; region?: string; fieldWork?: string }) => void
}) {
  const [country, setCountry] = useState(missionary.country ?? '')
  const [region, setRegion] = useState(missionary.region ?? '')
  const [fieldWork, setFieldWork] = useState(missionary.fieldWork ?? '')

  const dirty =
    country !== (missionary.country ?? '') || region !== (missionary.region ?? '') || fieldWork !== (missionary.fieldWork ?? '')

  if (!canWrite) {
    return (
      <div className="space-y-1 text-sm">
        <p>{[missionary.country, missionary.region].filter(Boolean).join(' ') || '파송지 미정'}</p>
        {missionary.fieldWork && <p className="text-[var(--color-muted-foreground)]">{missionary.fieldWork}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">파송지</h3>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="국가" value={country} onChange={(event) => setCountry(event.target.value)} className="w-32" />
        <Input placeholder="지역/도시" value={region} onChange={(event) => setRegion(event.target.value)} className="w-40" />
      </div>
      <Input placeholder="사역 내용" value={fieldWork} onChange={(event) => setFieldWork(event.target.value)} />
      {dirty && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() =>
              onSave({
                country: country.trim() || undefined,
                region: region.trim() || undefined,
                fieldWork: fieldWork.trim() || undefined,
              })
            }
          >
            저장
          </Button>
        </div>
      )}
    </div>
  )
}
