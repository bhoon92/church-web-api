import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
  createAccountCategory,
  createTransaction,
  deleteTransaction,
  formatKRW,
  listAccountCategories,
  listTransactions,
  type TransactionFlow,
} from '@/api/finance'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CategorySelect } from './category-select'

export function OperationsView() {
  const queryClient = useQueryClient()

  const { data: rows = [] } = useQuery({
    queryKey: ['finance', 'transactions'],
    queryFn: listTransactions,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] })
    queryClient.invalidateQueries({ queryKey: ['finance', 'dashboard'] })
  }

  const deleteMut = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: invalidate,
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <TransactionForm onCreated={invalidate} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
              운영 거래 기록이 없습니다.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {rows.map((r) => {
                const income = r.flow === 'income'
                return (
                  <li key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
                      {r.date.slice(5)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{r.title}</div>
                      <div className="text-xs text-[var(--color-muted-foreground)]">
                        {r.categoryName ?? (income ? '수입' : '지출')}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        income ? 'text-emerald-600' : 'text-[var(--color-foreground)]',
                      )}
                    >
                      {income ? '+' : '−'}
                      {formatKRW(r.amount)}
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('이 거래를 삭제할까요?')) deleteMut.mutate(r.id)
                      }}
                      className="rounded-full p-1 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)]"
                      aria-label="삭제"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TransactionForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [flow, setFlow] = useState<TransactionFlow>('expense')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today)
  const [categoryId, setCategoryId] = useState<number | null>(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['finance', 'account-categories'],
    queryFn: listAccountCategories,
  })

  const createCategoryMut = useMutation({
    mutationFn: createAccountCategory,
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'account-categories'] })
      setCategoryId(c.id)
    },
  })

  const createMut = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      setTitle('')
      setAmount('')
      onCreated()
    },
  })

  const submit = () => {
    const value = Number(amount.replace(/[^0-9]/g, ''))
    if (!title.trim() || !value) return
    createMut.mutate({
      flow,
      title: title.trim(),
      amount: value,
      date,
      accountCategoryId: categoryId ?? undefined,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-[var(--color-border)] p-0.5">
          {(['expense', 'income'] as TransactionFlow[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFlow(f)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                flow === f
                  ? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
                  : 'text-[var(--color-muted-foreground)]',
              )}
            >
              {f === 'expense' ? '지출' : '수입'}
            </button>
          ))}
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-40"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-12">
        <Input
          placeholder="적요 (예: 6월 임대료)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="sm:col-span-7"
        />
        <div className="flex gap-2 sm:col-span-5">
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
          <Button onClick={submit} disabled={!title.trim() || !amount || createMut.isPending}>
            추가
          </Button>
        </div>
      </div>

      <CategorySelect
        categories={categories}
        value={categoryId}
        onChange={setCategoryId}
        onCreate={(name) => createCategoryMut.mutate(name)}
        creating={createCategoryMut.isPending}
      />
    </div>
  )
}
