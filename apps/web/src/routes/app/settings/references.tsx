import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Eye, EyeOff, GripVertical, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import {
  copyReferenceYear,
  createReference,
  deleteReference,
  listReferences,
  REFERENCE_LABEL,
  updateReference,
  YEAR_SCOPED_KINDS,
  type Reference,
  type ReferenceKind,
} from '@/api/references';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/permissions';

const TABS: ReferenceKind[] = ['department', 'ministry', 'smallGroup', 'position', 'worshipService'];

export function ReferencesPage() {
  const [tab, setTab] = useState<ReferenceKind>('department');
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const isYearScoped = YEAR_SCOPED_KINDS.has(tab);
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <Link to="/app/settings" className="inline-flex items-center gap-1 hover:text-[var(--color-foreground)]">
          <ArrowLeft className="size-3.5" />
          설정으로
        </Link>
      </div>

      <PageHeader eyebrow="설정" title="부서·사역팀·목장·직분·예배" description="교회마다 다른 명칭과 구성을 자유롭게 관리합니다." />

      <div className="flex items-end justify-between gap-4 border-b border-[var(--color-border)]">
        <div className="flex gap-4">
          {TABS.map(tabOption => (
            <button
              key={tabOption}
              onClick={() => setTab(tabOption)}
              className={cn(
                'relative -mb-px border-b-2 px-1 py-2.5 text-sm font-medium transition-colors',
                tab === tabOption
                  ? 'border-[var(--color-foreground)] text-[var(--color-foreground)]'
                  : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              )}
            >
              {REFERENCE_LABEL[tabOption]}
            </button>
          ))}
        </div>

        {isYearScoped && (
          <div className="flex items-center gap-2 pb-1.5">
            <label htmlFor="reference-year" className="text-xs font-medium text-[var(--color-muted-foreground)]">
              편성 연도
            </label>
            <select
              id="reference-year"
              value={year}
              onChange={event => setYear(Number(event.target.value))}
              className="h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-sm focus-visible:border-[var(--color-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]/30"
            >
              {yearOptions.map(option => (
                <option key={option} value={option}>
                  {option}년
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <ReferenceTab kind={tab} year={isYearScoped ? year : undefined} />
    </div>
  );
}

function ReferenceTab({ kind, year }: { kind: ReferenceKind; year?: number }) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canWrite = can('settings:write');
  const queryKey = year != null ? ['references', kind, year] : ['references', kind];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => listReferences(kind, year),
  });

  const createMut = useMutation({
    mutationFn: (payload: { name: string }) => createReference(kind, payload, year),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteReference(kind, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // 빈 연도에 이전 연도(year-1) 구성을 복제.
  const copyMut = useMutation({
    mutationFn: () => copyReferenceYear(kind, year! - 1, year!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: error => window.alert(`복사 실패: ${error instanceof Error ? error.message : String(error)}`),
  });

  // 표시 순서(sortOrder)를 배열 위치 기준으로 다시 매겨, 바뀐 항목만 PATCH.
  const reorderMut = useMutation({
    mutationFn: async (ordered: Reference[]) => {
      await Promise.all(
        ordered
          .map((item, index) => (item.sortOrder === index ? null : updateReference(kind, item.id, { sortOrder: index })))
          .filter((promise): promise is Promise<Reference> => promise !== null)
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: error => window.alert(`순서 변경 실패: ${error instanceof Error ? error.message : String(error)}`),
  });

  const items = data ?? [];

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const clearDrag = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const ordered = [...items];
      const [moved] = ordered.splice(dragIndex, 1);
      ordered.splice(dragOverIndex, 0, moved);
      reorderMut.mutate(ordered);
    }
    clearDrag();
  };

  return (
    <div className="space-y-4">
      {canWrite && (
        <CreateRow
          label={REFERENCE_LABEL[kind]}
          onSubmit={name => createMut.mutate({ name })}
          pending={createMut.isPending}
          placeholder={`예: ${exampleFor(kind)}`}
        />
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">불러오는 중…</div>
          ) : items.length === 0 ? (
            <div className="space-y-3 py-12 text-center text-sm text-[var(--color-muted-foreground)]">
              <p>
                {year != null ? `${year}년에 등록된 ` : '등록된 '}
                {REFERENCE_LABEL[kind]}이 없습니다.
              </p>
              {year != null && canWrite && (
                <Button variant="outline" size="sm" onClick={() => copyMut.mutate()} disabled={copyMut.isPending}>
                  {copyMut.isPending ? '복사 중…' : `${year - 1}년 구성 복사해오기`}
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {items.map((item, index) => (
                <ReferenceRow
                  key={item.id}
                  kind={kind}
                  item={item}
                  canWrite={canWrite}
                  reordering={reorderMut.isPending}
                  isDragging={dragIndex === index}
                  isDragOver={dragOverIndex === index && dragIndex !== index}
                  onDragStart={() => setDragIndex(index)}
                  onDragEnter={() => setDragOverIndex(index)}
                  onDrop={handleDrop}
                  onDragEnd={clearDrag}
                  onDelete={() => deleteMut.mutate(item.id)}
                  onChanged={() => queryClient.invalidateQueries({ queryKey })}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateRow({
  label,
  onSubmit,
  pending,
  placeholder,
}: {
  label: string;
  onSubmit: (name: string) => void;
  pending: boolean;
  placeholder: string;
}) {
  const [name, setName] = useState('');

  return (
    <Card>
      <form
        onSubmit={event => {
          event.preventDefault();
          if (!name.trim()) return;
          onSubmit(name.trim());
          setName('');
        }}
        className="flex items-end gap-3 p-4"
      >
        <label className="flex-1 space-y-1.5">
          <span className="block text-xs font-medium text-[var(--color-muted-foreground)]">{label} 추가</span>
          <Input value={name} onChange={event => setName(event.target.value)} placeholder={placeholder} maxLength={40} />
        </label>
        <Button type="submit" disabled={!name.trim() || pending}>
          <Plus className="size-4" />
          {pending ? '추가 중…' : '추가'}
        </Button>
      </form>
    </Card>
  );
}

function ReferenceRow({
  kind,
  item,
  canWrite,
  reordering,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragEnd,
  onDelete,
  onChanged,
}: {
  kind: ReferenceKind;
  item: Reference;
  canWrite: boolean;
  reordering: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onDelete: () => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [grabbed, setGrabbed] = useState(false);
  const [nameDraft, setNameDraft] = useState(item.name);
  const [descriptionDraft, setDescriptionDraft] = useState(item.description ?? '');

  const saveMut = useMutation({
    mutationFn: (payload: { name: string; description: string }) =>
      updateReference(kind, item.id, { name: payload.name, description: payload.description }),
    onSuccess: () => {
      setEditing(false);
      onChanged();
    },
  });

  const toggleActiveMut = useMutation({
    mutationFn: () => updateReference(kind, item.id, { isActive: !item.isActive }),
    onSuccess: () => onChanged(),
    onError: error => window.alert(`상태 변경 실패: ${error instanceof Error ? error.message : String(error)}`),
  });

  const startEditing = () => {
    setNameDraft(item.name);
    setDescriptionDraft(item.description ?? '');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setNameDraft(item.name);
    setDescriptionDraft(item.description ?? '');
  };

  const submit = () => {
    const name = nameDraft.trim();
    const description = descriptionDraft.trim();
    if (!name) {
      cancelEditing();
      return;
    }
    if (name === item.name && description === (item.description ?? '')) {
      cancelEditing();
      return;
    }
    saveMut.mutate({ name, description });
  };

  if (editing) {
    return (
      <li className="space-y-2 px-5 py-3">
        <Input
          value={nameDraft}
          onChange={event => setNameDraft(event.target.value)}
          autoFocus
          maxLength={40}
          placeholder="이름"
          onKeyDown={event => {
            if (event.key === 'Enter') submit();
            if (event.key === 'Escape') cancelEditing();
          }}
          className="h-9"
        />
        <div className="flex items-center gap-2">
          <Input
            value={descriptionDraft}
            onChange={event => setDescriptionDraft(event.target.value)}
            maxLength={200}
            placeholder="설명 (선택)"
            onKeyDown={event => {
              if (event.key === 'Enter') submit();
              if (event.key === 'Escape') cancelEditing();
            }}
            className="h-9"
          />
          <Button size="icon" variant="ghost" onClick={submit} disabled={saveMut.isPending} aria-label="저장">
            <Check className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={cancelEditing} aria-label="취소">
            <X className="size-4" />
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li
      draggable={canWrite && grabbed}
      onDragStart={event => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', '');
        onDragStart();
      }}
      onDragEnter={onDragEnter}
      onDragOver={event => event.preventDefault()}
      onDrop={event => {
        event.preventDefault();
        onDrop();
      }}
      onDragEnd={() => {
        setGrabbed(false);
        onDragEnd();
      }}
      className={cn(
        'flex items-center gap-2 px-5 py-3 transition-colors',
        isDragging && 'opacity-40',
        isDragOver && 'bg-[var(--color-muted)]'
      )}
    >
      {canWrite && (
        <button
          type="button"
          aria-label="드래그하여 순서 변경"
          onMouseDown={() => !reordering && setGrabbed(true)}
          onMouseUp={() => setGrabbed(false)}
          className="cursor-grab text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <button
          onClick={() => canWrite && startEditing()}
          disabled={!canWrite}
          className={cn('block max-w-full truncate text-left text-sm font-medium', canWrite && 'hover:underline')}
        >
          {item.name}
        </button>
        {item.description && <p className="truncate text-xs text-[var(--color-muted-foreground)]">{item.description}</p>}
      </div>

      {!item.isActive && <Badge tone="muted">비활성</Badge>}

      {canWrite && (
        <>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => toggleActiveMut.mutate()}
            disabled={toggleActiveMut.isPending}
            aria-label={item.isActive ? '비활성화' : '활성화'}
            title={item.isActive ? '비활성화' : '활성화'}
          >
            {item.isActive ? <Eye className="size-4" /> : <EyeOff className="size-4 text-[var(--color-muted-foreground)]" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (window.confirm(`"${item.name}" 을(를) 삭제할까요?`)) onDelete();
            }}
            aria-label="삭제"
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      )}
    </li>
  );
}

function exampleFor(kind: ReferenceKind): string {
  switch (kind) {
    case 'department':
      return '청년부 / 장년부 / 중고등부';
    case 'ministry':
      return '찬양팀 / 새가족팀';
    case 'smallGroup':
      return '1구역 / 행복목장';
    case 'position':
      return '성도 / 집사 / 안수집사 / 장로';
    case 'worshipService':
      return '주일 1부 / 주일 2부 / 수요예배 / 새벽기도';
  }
}
