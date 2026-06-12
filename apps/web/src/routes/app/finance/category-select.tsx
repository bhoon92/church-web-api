import { useState } from 'react'

import type { Category } from '@/api/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** 카테고리 알약 선택 + 인라인 추가 (헌금 종류 / 계정과목 공용). */
export function CategorySelect({
  categories,
  value,
  onChange,
  onCreate,
  creating,
}: {
  categories: Category[]
  value: number | null
  onChange: (id: number) => void
  onCreate: (name: string) => void
  creating: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.id)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            value === category.id
              ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
              : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]',
          )}
        >
          {category.name}
        </button>
      ))}

      {adding ? (
        <span className="inline-flex items-center gap-1">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            maxLength={20}
            placeholder="새 분류"
            className="h-8 w-28"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && name.trim()) {
                onCreate(name.trim())
                setName('')
                setAdding(false)
              }
              if (event.key === 'Escape') {
                setAdding(false)
                setName('')
              }
            }}
          />
        </span>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setAdding(true)}
          disabled={creating}
          className="h-8 text-xs"
        >
          + 분류 추가
        </Button>
      )}
    </div>
  )
}
