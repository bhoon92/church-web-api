import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import {
  createReference,
  deleteReference,
  listReferences,
  REF_LABEL,
  updateReference,
  type Reference,
  type ReferenceKind,
} from '@/api/references'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'

const TABS: ReferenceKind[] = ['department', 'ministry', 'smallGroup', 'position', 'worshipService']

export function ReferencesPage() {
  const [tab, setTab] = useState<ReferenceKind>('department')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <Link
          to="/app/settings"
          className="inline-flex items-center gap-1 hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="size-3.5" />
          설정으로
        </Link>
      </div>

      <PageHeader
        eyebrow="설정"
        title="부서·사역팀·목장·직분·예배"
        description="교회마다 다른 명칭과 구성을 자유롭게 관리합니다."
      />

      <div className="border-b border-[var(--color-border)]">
        <div className="flex gap-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'relative -mb-px border-b-2 px-1 py-2.5 text-sm font-medium transition-colors',
                tab === t
                  ? 'border-[var(--color-foreground)] text-[var(--color-foreground)]'
                  : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
              )}
            >
              {REF_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <ReferenceTab kind={tab} />
    </div>
  )
}

function ReferenceTab({ kind }: { kind: ReferenceKind }) {
  const queryClient = useQueryClient()
  const queryKey = ['references', kind]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => listReferences(kind),
  })

  const createMut = useMutation({
    mutationFn: (payload: { name: string }) => createReference(kind, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteReference(kind, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const items = data ?? []

  return (
    <Card>
      <CardContent className="p-0">
        <CreateRow
          onSubmit={(name) => createMut.mutate({ name })}
          pending={createMut.isPending}
          placeholder={`예: ${exampleFor(kind)}`}
        />

        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
            불러오는 중…
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
            등록된 {REF_LABEL[kind]}이 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {items.map((it) => (
              <ReferenceRow
                key={it.id}
                kind={kind}
                item={it}
                onDelete={() => deleteMut.mutate(it.id)}
                onRenamed={() => queryClient.invalidateQueries({ queryKey })}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function CreateRow({
  onSubmit,
  pending,
  placeholder,
}: {
  onSubmit: (name: string) => void
  pending: boolean
  placeholder: string
}) {
  const [name, setName] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onSubmit(name.trim())
        setName('')
      }}
      className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-muted)] px-5 py-3"
    >
      <Plus className="size-4 text-[var(--color-muted-foreground)]" />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        className="h-9 border-transparent bg-transparent focus-visible:bg-[var(--color-background)] focus-visible:ring-1"
        maxLength={40}
      />
      <Button size="sm" type="submit" disabled={!name.trim() || pending}>
        {pending ? '추가 중…' : '추가'}
      </Button>
    </form>
  )
}

function ReferenceRow({
  kind,
  item,
  onDelete,
  onRenamed,
}: {
  kind: ReferenceKind
  item: Reference
  onDelete: () => void
  onRenamed: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.name)

  const renameMut = useMutation({
    mutationFn: (name: string) => updateReference(kind, item.id, { name }),
    onSuccess: () => {
      setEditing(false)
      onRenamed()
    },
  })

  const submit = () => {
    if (!draft.trim() || draft.trim() === item.name) {
      setEditing(false)
      setDraft(item.name)
      return
    }
    renameMut.mutate(draft.trim())
  }

  return (
    <li className="flex items-center gap-3 px-5 py-3">
      {editing ? (
        <>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            maxLength={40}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') {
                setEditing(false)
                setDraft(item.name)
              }
            }}
            className="h-9"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={submit}
            disabled={renameMut.isPending}
            aria-label="저장"
          >
            <Check className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setEditing(false)
              setDraft(item.name)
            }}
            aria-label="취소"
          >
            <X className="size-4" />
          </Button>
        </>
      ) : (
        <>
          <button
            onClick={() => setEditing(true)}
            className="flex-1 truncate text-left text-sm font-medium hover:underline"
          >
            {item.name}
          </button>
          {!item.isActive && <Badge tone="muted">비활성</Badge>}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (window.confirm(`"${item.name}" 을(를) 삭제할까요?`)) onDelete()
            }}
            aria-label="삭제"
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      )}
    </li>
  )
}

function exampleFor(kind: ReferenceKind): string {
  switch (kind) {
    case 'department':
      return '청년부 / 장년부 / 중고등부'
    case 'ministry':
      return '찬양팀 / 새가족팀'
    case 'smallGroup':
      return '1구역 / 행복목장'
    case 'position':
      return '성도 / 집사 / 안수집사 / 장로'
    case 'worshipService':
      return '주일 1부 / 주일 2부 / 수요예배 / 새벽기도'
  }
}
