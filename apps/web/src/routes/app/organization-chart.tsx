import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Crown, Settings2, Users } from 'lucide-react';
import { useState } from 'react';

import { fetchOrganizationChart, ORGANIZATION_KIND, ORGANIZATION_KIND_LABEL, type OrganizationKind, type OrganizationPerson, type OrganizationUnit } from '@/api/organization-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { ReferenceManagerModal } from '@/components/reference-manager';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/permissions';

export function OrganizationChartPage() {
  const [kind, setKind] = useState<OrganizationKind>('department');
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [managing, setManaging] = useState(false);
  const { can } = usePermissions();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['organization-chart', year],
    queryFn: () => fetchOrganizationChart(year),
  });

  const units = data?.[kind] ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="조직도"
        title="조직도"
        description="교인의 소속 정보에서 기관·사역팀·공동체별 구성을 보여줍니다. 편집은 교인 상세에서 합니다."
        actions={
          can('settings:write') && (
            <Button variant="outline" onClick={() => setManaging(true)}>
              <Settings2 />
              구성 관리
            </Button>
          )
        }
      />

      {managing && (
        <ReferenceManagerModal title="기관·사역팀·공동체 관리" kinds={['department', 'ministry', 'smallGroup']} onClose={() => setManaging(false)} />
      )}

      <div className="flex items-center justify-between gap-4">
        <KindTabs kind={kind} onSelect={setKind} />
        <div className="flex items-center gap-2">
          <label htmlFor="organization-year" className="text-xs font-medium text-[var(--color-muted-foreground)]">
            편성 연도
          </label>
          <select
            id="organization-year"
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
      </div>

      {isLoading ? (
        <EmptyState text="불러오는 중…" />
      ) : isError ? (
        <EmptyState text="조직도를 불러오지 못했습니다." />
      ) : units.length === 0 ? (
        <EmptyState text={`등록된 ${ORGANIZATION_KIND_LABEL[kind]}가 없습니다. 우측 상단 '구성 관리'에서 등록하세요.`} />
      ) : (
        <Card className="divide-y divide-[var(--color-border)] overflow-hidden">
          {units.map(unit => (
            <UnitRow key={unit.referenceId} unit={unit} />
          ))}
        </Card>
      )}
    </div>
  );
}

function KindTabs({ kind, onSelect }: { kind: OrganizationKind; onSelect: (kind: OrganizationKind) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-1">
      {ORGANIZATION_KIND.map(organizationKind => (
        <button
          key={organizationKind}
          onClick={() => onSelect(organizationKind)}
          className={cn(
            'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
            kind === organizationKind
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          )}
        >
          {ORGANIZATION_KIND_LABEL[organizationKind]}
        </button>
      ))}
    </div>
  );
}

function UnitRow({ unit }: { unit: OrganizationUnit }) {
  const [open, setOpen] = useState(false);

  const leaderSummary = unit.leader
    .slice(0, 2)
    .map(person => (person.roleLabel ? `${person.roleLabel} ${person.name}` : person.name))
    .join(' · ')
    .concat(unit.leader.length > 2 ? ` 외 ${unit.leader.length - 2}명` : '');

  return (
    <div>
      <button
        className={cn(
          'flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--color-muted)]/50',
          open && 'bg-[var(--color-muted)]/40'
        )}
        onClick={() => setOpen(prev => !prev)}
      >
        <div className="min-w-0 flex-1">
          <span className="font-semibold">{unit.referenceName}</span>
          {leaderSummary && (
            <span className="ml-3 text-sm text-[var(--color-muted-foreground)]">
              {leaderSummary}
            </span>
          )}
        </div>
        <Badge tone="muted" className="shrink-0">
          <Users className="size-3" />
          {unit.total}명
        </Badge>
        <ChevronDown
          className={cn('size-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/20 px-5 py-4">
          {unit.total === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">구성원이 없습니다.</p>
          ) : (
            <div className="space-y-5">
              {unit.leader.length > 0 && (
                <section className="space-y-1">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    <Crown className="size-3.5" />
                    리더
                  </div>
                  <MemberList persons={unit.leader} isLeader />
                </section>
              )}
              {unit.member.length > 0 && (
                <section className="space-y-1">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    <Users className="size-3.5" />
                    구성원
                  </div>
                  <MemberList persons={unit.member} isLeader={false} />
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemberList({ persons, isLeader }: { persons: OrganizationPerson[]; isLeader: boolean }) {
  return (
    <div className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
      {persons.map(person => (
        <div key={person.memberId} className="flex items-center justify-between px-4 py-2.5">
          <span className={cn('text-sm', isLeader && 'font-medium')}>{person.name}</span>
          {person.roleLabel && (
            <Badge tone={isLeader ? 'accent' : 'neutral'}>{person.roleLabel}</Badge>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card>
      <div className="py-12 text-center">
        <p className="text-sm text-[var(--color-muted-foreground)]">{text}</p>
      </div>
    </Card>
  );
}
