import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import {
  createOffering,
  createOfferingCategory,
  formatKRW,
  listOfferingCategories,
  listOfferings,
} from '@/api/finance'
import { exportOfferings } from '@/api/exports'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Download } from 'lucide-react'
import { usePermissions } from '@/lib/permissions'
import { CategorySelect } from './category-select'
import { MemberPicker } from './member-picker'

export function OfferingsView() {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const canWrite = can('finance:write')
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)

  const { data: list } = useQuery({
    queryKey: ['finance', 'offerings', date],
    queryFn: () => listOfferings({ date }),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['finance', 'offerings', date] })
    queryClient.invalidateQueries({ queryKey: ['finance', 'dashboard'] })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">입력 날짜</span>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
            {canWrite && <Badge tone="accent">빠른 입력</Badge>}
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={() => void exportOfferings(Number(date.slice(0, 4)))}
            >
              <Download className="size-3.5" />
              {date.slice(0, 4)}년 엑셀
            </Button>
          </div>
          {canWrite && <OfferingForm date={date} onCreated={invalidate} />}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-12 gap-4 border-b border-[var(--color-border)] bg-[var(--color-muted)] px-5 py-2 text-xs font-medium text-[var(--color-muted-foreground)]">
            <div className="col-span-5">성도</div>
            <div className="col-span-3">분류</div>
            <div className="col-span-4 text-right">금액</div>
          </div>
          {!list || list.items.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
              이 날짜의 헌금 기록이 없습니다.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {list.items.map((o) => (
                <li key={o.id} className="grid grid-cols-12 items-center gap-4 px-5 py-3">
                  <div className="col-span-5 text-sm font-medium">
                    {o.memberName ?? o.rawDonorName ?? '(미상)'}
                  </div>
                  <div className="col-span-3">
                    <Badge tone="muted">{o.categoryName ?? '—'}</Badge>
                  </div>
                  <div className="col-span-4 text-right text-sm font-semibold tabular-nums">
                    {formatKRW(o.amount)}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-5 py-3 text-sm">
            <span className="text-[var(--color-muted-foreground)]">총 {list?.count ?? 0}건</span>
            <span className="font-semibold tabular-nums">{formatKRW(list?.total ?? 0)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function OfferingForm({ date, onCreated }: { date: string; onCreated: () => void }) {
  const queryClient = useQueryClient()
  const [member, setMember] = useState<{ id: number; name: string } | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [amount, setAmount] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['finance', 'offering-categories'],
    queryFn: listOfferingCategories,
  })

  const createCategoryMut = useMutation({
    mutationFn: createOfferingCategory,
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'offering-categories'] })
      setCategoryId(c.id)
    },
  })

  const createMut = useMutation({
    mutationFn: createOffering,
    onSuccess: () => {
      setMember(null)
      setAmount('')
      onCreated()
    },
  })

  const submit = () => {
    const value = Number(amount.replace(/[^0-9]/g, ''))
    if (!member || !categoryId || !value) return
    createMut.mutate({ memberId: member.id, offeringCategoryId: categoryId, amount: value, date })
  }

  return (
    <div className="grid gap-3 sm:grid-cols-12">
      <div className="sm:col-span-4">
        <MemberPicker
          selectedName={member?.name ?? null}
          onSelect={setMember}
        />
      </div>
      <div className="sm:col-span-5">
        <CategorySelect
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          onCreate={(name) => createCategoryMut.mutate(name)}
          creating={createCategoryMut.isPending}
        />
      </div>
      <div className="flex gap-2 sm:col-span-3">
        <Input
          inputMode="numeric"
          placeholder="금액"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          className="text-right tabular-nums"
        />
        <Button
          onClick={submit}
          disabled={!member || !categoryId || !amount || createMut.isPending}
        >
          추가
        </Button>
      </div>
    </div>
  )
}
