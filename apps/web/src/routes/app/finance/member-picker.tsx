import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { listMembers } from '@/api/members'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** 성도 검색 → 선택. 선택 시 memberId + 이름 콜백. */
export function MemberPicker({
  selectedName,
  onSelect,
}: {
  selectedName: string | null
  onSelect: (member: { id: number; name: string }) => void
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ['members', { q, page: 1, pageSize: 8 }],
    queryFn: () => listMembers({ q: q || undefined, page: 1, pageSize: 8 }),
    enabled: open,
  })

  const items = data?.items ?? []

  return (
    <div className="relative">
      <Input
        value={open ? q : (selectedName ?? '')}
        placeholder="성도 검색…"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && items.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-1 shadow-md">
          {items.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect({ id: m.id, name: m.name })
                  setQ('')
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[var(--color-muted)]',
                )}
              >
                <span className="font-medium">{m.name}</span>
                {m.phone && (
                  <span className="text-xs text-[var(--color-muted-foreground)]">{m.phone}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
