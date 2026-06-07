import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Phone, Plus, Search, UserPlus, X } from 'lucide-react'
import { useState } from 'react'

import {
  createMember,
  LIFECYCLE_STAGES,
  listMembers,
  STAGE_LABEL,
  type LifecycleStage,
  type Member,
  type StageCounts,
} from '@/api/members'
import { exportMembers } from '@/api/exports'
import { MemberDetailModal } from '@/routes/app/member-detail-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'

const STAGE_TONE: Record<LifecycleStage, 'neutral' | 'muted' | 'success' | 'warn' | 'danger'> = {
  visitor: 'muted',
  new: 'warn',
  regular: 'success',
  transferred: 'muted',
  deceased: 'neutral',
  absent: 'danger',
  anonymous: 'neutral',
}

const FILTER_ORDER: (LifecycleStage | 'all')[] = [
  'all',
  'regular',
  'new',
  'visitor',
  'absent',
]

export function MembersPage() {
  const [q, setQ] = useState('')
  const [stage, setStage] = useState<LifecycleStage | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [openMemberId, setOpenMemberId] = useState<number | null>(null)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['members', { q, stage }],
    queryFn: () =>
      listMembers({
        q: q || undefined,
        stage: stage === 'all' ? undefined : [stage],
      }),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="재적"
        title="성도 명부"
        description="등록된 성도와 새가족을 관리합니다."
        actions={
          <>
            <Button variant="outline" onClick={() => void exportMembers()}>
              <Download />
              내보내기
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus />
              성도 추가
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <Input
            placeholder="이름·전화번호·이전교회로 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <FilterChips
        active={stage}
        onChange={setStage}
        counts={data?.counts}
      />

      <MemberList
        members={data?.items ?? []}
        total={data?.total ?? 0}
        loading={isLoading}
        onSelect={setOpenMemberId}
      />

      {showCreate && (
        <CreateMemberModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            void queryClient.invalidateQueries({ queryKey: ['members'] })
            setShowCreate(false)
          }}
        />
      )}

      {openMemberId !== null && (
        <MemberDetailModal
          memberId={openMemberId}
          onClose={() => setOpenMemberId(null)}
        />
      )}
    </div>
  )
}

function FilterChips({
  active,
  onChange,
  counts,
}: {
  active: LifecycleStage | 'all'
  onChange: (s: LifecycleStage | 'all') => void
  counts?: StageCounts
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_ORDER.map((key) => {
        const label = key === 'all' ? '전체' : STAGE_LABEL[key]
        const count = counts ? counts[key] : undefined
        const isActive = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'border-transparent bg-[var(--color-foreground)] text-[var(--color-background)]'
                : 'border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            )}
          >
            {label}
            {count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px] tabular-nums',
                  isActive
                    ? 'bg-white/15 text-current'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function MemberList({
  members,
  total,
  loading,
  onSelect,
}: {
  members: Member[]
  total: number
  loading: boolean
  onSelect: (id: number) => void
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
          불러오는 중…
        </CardContent>
      </Card>
    )
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <UserPlus className="size-6 text-[var(--color-muted-foreground)]" />
          <p className="text-sm font-medium">아직 등록된 성도가 없어요</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            우측 상단 "성도 추가" 버튼으로 시작하세요.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-[var(--color-border)]">
        {members.map((m) => (
          <li key={m.id}>
            <button
              onClick={() => onSelect(m.id)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--color-muted)]"
            >
              <Avatar name={m.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{m.name}</span>
                  <Badge tone={STAGE_TONE[m.lifecycleStage]}>
                    {STAGE_LABEL[m.lifecycleStage]}
                  </Badge>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                  {m.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3" />
                      {m.phone}
                    </span>
                  )}
                  {m.previousChurch && <span>· 이전: {m.previousChurch}</span>}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <CardContent className="border-t border-[var(--color-border)] py-3 text-xs text-[var(--color-muted-foreground)]">
        총 {total}명
      </CardContent>
    </Card>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.slice(0, 2)
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] text-xs font-semibold text-[var(--color-foreground)]">
      {initials}
    </div>
  )
}

function CreateMemberModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [stage, setStage] = useState<LifecycleStage>('visitor')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: createMember,
    onSuccess: () => onCreated(),
    onError: (err: Error) => setError(err.message),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    mutation.mutate({
      name,
      phone: phone || undefined,
      lifecycleStage: stage,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--color-background)] p-6 shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">성도 추가</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="닫기"
          >
            <X />
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="이름" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
              placeholder="예: 김민서"
            />
          </Field>

          <Field label="전화번호" hint="선택">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
            />
          </Field>

          <Field label="단계">
            <div className="flex flex-wrap gap-1.5">
              {LIFECYCLE_STAGES.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStage(s)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    stage === s
                      ? 'border-transparent bg-[var(--color-foreground)] text-[var(--color-background)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                  )}
                >
                  {STAGE_LABEL[s]}
                </button>
              ))}
            </div>
          </Field>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={!name || mutation.isPending}
            >
              {mutation.isPending ? '추가 중…' : '추가하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">
          {label}
          {required && (
            <span className="ml-0.5 text-[var(--color-primary)]">*</span>
          )}
        </span>
        {hint && (
          <span className="text-xs text-[var(--color-muted-foreground)]">
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  )
}
