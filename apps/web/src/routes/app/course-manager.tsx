import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Eye, EyeOff, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  TRAINING_FORMAT_LABEL,
  createCourse,
  listCourses,
  updateCourse,
  type TrainingCourse,
  type TrainingFormat,
} from '@/api/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/lib/permissions'

const FORMATS: TrainingFormat[] = ['weekly', 'retreat', 'intensive', 'etc']

/**
 * 훈련 과정 관리 — 다른 기준정보와 달리 `format`·`defaultSessionCount` 가 있어
 * 공용 ReferenceManager 를 쓰지 않고 전용 화면을 둔다.
 */
export function CourseManagerModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-[var(--color-background)] shadow-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
          <h2 className="text-base font-semibold">훈련 과정 관리</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
            <X />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <CourseList />
        </div>
      </div>
    </div>
  )
}

function CourseList() {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const canWrite = can('training:write')
  const [adding, setAdding] = useState(false)

  const { data: courses = [], isLoading } = useQuery({ queryKey: ['training', 'courses'], queryFn: listCourses })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['training', 'courses'] })

  const toggleMut = useMutation({
    mutationFn: (course: TrainingCourse) => updateCourse(course.id, { isActive: !course.isActive }),
    onSuccess: invalidate,
    onError: (error: Error) => window.alert(`변경 실패: ${error.message}`),
  })

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--color-muted-foreground)]">
        기수를 열 때 쓰는 틀입니다. 회차 수는 기수 개설 시 기본값으로 채워지며, 이미 만들어진 기수에는 영향을 주지 않습니다.
      </p>

      {isLoading ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">불러오는 중…</p>
      ) : (
        <ul className="space-y-2">
          {courses.map((course) => (
            <li
              key={course.id}
              className={cn(
                'flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2.5',
                !course.isActive && 'opacity-50',
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{course.name}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {TRAINING_FORMAT_LABEL[course.format]} · 기본 {course.defaultSessionCount}회차
                  {course.description ? ` · ${course.description}` : ''}
                </p>
              </div>
              {canWrite && (
                <button
                  onClick={() => toggleMut.mutate(course)}
                  className="shrink-0 rounded-full p-1 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)]"
                  aria-label={course.isActive ? '비활성화' : '활성화'}
                  title={course.isActive ? '비활성화' : '활성화'}
                >
                  {course.isActive ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canWrite &&
        (adding ? (
          <CourseForm
            onDone={() => {
              invalidate()
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" />
            과정 추가
          </Button>
        ))}
    </div>
  )
}

function CourseForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [format, setFormat] = useState<TrainingFormat>('weekly')
  const [sessionCount, setSessionCount] = useState('1')

  const createMut = useMutation({
    mutationFn: () =>
      createCourse({ name: name.trim(), format, defaultSessionCount: Number(sessionCount) || 1 }),
    onSuccess: onDone,
    onError: (error: Error) => window.alert(`과정 추가 실패: ${error.message}`),
  })

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-[var(--color-border)] p-3">
      <Input placeholder="과정 이름 (예: 살아있는 믿음학교)" value={name} onChange={(event) => setName(event.target.value)} />
      <div className="flex flex-wrap gap-1.5">
        {FORMATS.map((option) => (
          <button
            key={option}
            onClick={() => setFormat(option)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              format === option
                ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
                : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]',
            )}
          >
            {TRAINING_FORMAT_LABEL[option]}
          </button>
        ))}
      </div>
      <Input
        type="number"
        min={1}
        placeholder="기본 회차 수"
        value={sessionCount}
        onChange={(event) => setSessionCount(event.target.value)}
        className="w-40"
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button size="sm" onClick={() => createMut.mutate()} disabled={!name.trim() || createMut.isPending}>
          <Check className="size-3.5" />
          추가
        </Button>
      </div>
    </div>
  )
}
