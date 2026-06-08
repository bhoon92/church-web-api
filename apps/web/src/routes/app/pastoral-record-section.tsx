import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

import {
  createPastoralRecord,
  deletePastoralRecord,
  listPastoralRecords,
  PASTORAL_RECORD_TYPES,
  PASTORAL_RECORD_TYPE_LABEL,
  type CreatePastoralRecordPayload,
  type PastoralRecordType,
} from '@/api/pastoral-records'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/lib/permissions'

const TYPE_TONE: Record<PastoralRecordType, 'neutral' | 'muted' | 'success' | 'warn'> = {
  visit: 'success',
  newcomer_education: 'warn',
  counsel: 'muted',
  etc: 'neutral',
}

export function PastoralRecordSection({ memberId }: { memberId: number }) {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const canWrite = can('pastoral:write')
  const [adding, setAdding] = useState(false)

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['pastoral-records', memberId],
    queryFn: () => listPastoralRecords(memberId),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['pastoral-records', memberId] })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deletePastoralRecord(memberId, id),
    onSuccess: invalidate,
  })

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">사역 기록</h3>
        {canWrite && (
          <Button size="sm" variant="ghost" onClick={() => setAdding(!adding)}>
            <Plus className="size-3.5" />
            기록
          </Button>
        )}
      </div>

      {adding && (
        <RecordForm
          memberId={memberId}
          onDone={() => {
            invalidate()
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {isLoading ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">불러오는 중…</p>
      ) : records.length === 0 && !adding ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">사역 기록 없음</p>
      ) : (
        <ul className="mt-1 space-y-3">
          {records.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-[var(--color-border)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={TYPE_TONE[r.type]}>
                    {PASTORAL_RECORD_TYPE_LABEL[r.type]}
                  </Badge>
                  <span className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
                    {r.date}
                  </span>
                  {r.location && (
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      · {r.location}
                    </span>
                  )}
                </div>
                {canWrite && (
                  <button
                    onClick={() => {
                      if (window.confirm('이 기록을 삭제할까요?')) deleteMut.mutate(r.id)
                    }}
                    className="rounded-full p-0.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)]"
                    aria-label="삭제"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm">{r.content}</p>

              {r.prayerRequest && (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-[var(--color-muted)] px-2.5 py-1.5 text-xs">
                  <span className="font-medium">기도제목 </span>
                  {r.prayerRequest}
                </p>
              )}
              {r.statusNote && (
                <p className="mt-1.5 whitespace-pre-wrap text-xs text-[var(--color-muted-foreground)]">
                  <span className="font-medium">상황 </span>
                  {r.statusNote}
                </p>
              )}

              <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
                {r.recorderName ?? '작성자 미상'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RecordForm({
  memberId,
  onDone,
  onCancel,
}: {
  memberId: number
  onDone: () => void
  onCancel: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [type, setType] = useState<PastoralRecordType>('visit')
  const [date, setDate] = useState(today)
  const [location, setLocation] = useState('')
  const [content, setContent] = useState('')
  const [prayerRequest, setPrayerRequest] = useState('')
  const [statusNote, setStatusNote] = useState('')

  const createMut = useMutation({
    mutationFn: (payload: CreatePastoralRecordPayload) =>
      createPastoralRecord(memberId, payload),
    onSuccess: onDone,
  })

  const submit = () => {
    if (!content.trim()) return
    createMut.mutate({
      type,
      date,
      location: location.trim() || undefined,
      content: content.trim(),
      prayerRequest: prayerRequest.trim() || undefined,
      statusNote: statusNote.trim() || undefined,
    })
  }

  return (
    <div className="mb-3 space-y-3 rounded-xl border border-dashed border-[var(--color-border)] p-3">
      <div className="flex flex-wrap gap-1.5">
        {PASTORAL_RECORD_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              type === t
                ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
                : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]',
            )}
          >
            {PASTORAL_RECORD_TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-40"
        />
        <Input
          placeholder="장소 (선택)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <textarea
        placeholder="본문"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-foreground)]"
      />
      <textarea
        placeholder="기도제목 (선택)"
        value={prayerRequest}
        onChange={(e) => setPrayerRequest(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-foreground)]"
      />
      <textarea
        placeholder="현재 상황 (선택)"
        value={statusNote}
        onChange={(e) => setStatusNote(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-foreground)]"
      />

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button
          size="sm"
          onClick={submit}
          disabled={!content.trim() || createMut.isPending}
        >
          저장
        </Button>
      </div>
    </div>
  )
}
