import { useQuery } from '@tanstack/react-query';
import { Crown, Users } from 'lucide-react';
import { useState } from 'react';

import { fetchOrganizationChart, ORGANIZATION_KIND, ORGANIZATION_KIND_LABEL, type OrganizationKind, type OrganizationPerson, type OrganizationUnit } from '@/api/organization-chart';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';

export function OrganizationChartPage() {
  const [kind, setKind] = useState<OrganizationKind>('department');
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['organization-chart', year],
    queryFn: () => fetchOrganizationChart(year),
  });

  const unit = data?.[kind] ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="조직도"
        title="조직도"
        description="재적의 소속 정보에서 부서·사역팀·목장별 구성을 보여줍니다. 편집은 재적 상세에서 합니다."
      />

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
        <EmptyCard text="불러오는 중…" />
      ) : isError ? (
        <EmptyCard text="조직도를 불러오지 못했습니다." />
      ) : unit.length === 0 ? (
        <EmptyCard text={`등록된 ${ORGANIZATION_KIND_LABEL[kind]}가 없습니다. 설정에서 먼저 등록하세요.`} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {unit.map(organizationUnit => (
            <UnitCard key={organizationUnit.referenceId} unit={organizationUnit} />
          ))}
        </div>
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

function UnitCard({ unit }: { unit: OrganizationUnit }) {
  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold tracking-tight">{unit.referenceName}</h3>
          <Badge tone="muted">
            <Users className="size-3" />
            {unit.total}
          </Badge>
        </div>

        {unit.total === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">구성원 없음</p>
        ) : (
          <div className="space-y-3">
            {unit.leader.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {unit.leader.map(person => (
                  <LeaderChip key={person.memberId} person={person} />
                ))}
              </div>
            )}
            {unit.member.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {unit.member.map(person => (
                  <Badge key={person.memberId} tone="neutral">
                    {person.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeaderChip({ person }: { person: OrganizationPerson }) {
  return (
    <Badge tone="accent">
      <Crown className="size-3" />
      {person.name}
      {person.roleLabel && <span className="opacity-70">· {person.roleLabel}</span>}
    </Badge>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-sm text-[var(--color-muted-foreground)]">{text}</p>
      </CardContent>
    </Card>
  );
}
