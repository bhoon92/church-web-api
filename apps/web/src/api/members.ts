export type LifecycleStage = 'visitor' | 'new' | 'regular' | 'transferred' | 'deceased' | 'absent' | 'anonymous';

export const LIFECYCLE_STAGES: LifecycleStage[] = ['visitor', 'new', 'regular', 'transferred', 'deceased', 'absent', 'anonymous'];

export const STAGE_LABEL: Record<LifecycleStage, string> = {
  visitor: '방문',
  new: '새가족',
  regular: '정식',
  transferred: '이명',
  deceased: '별세',
  absent: '장기결석',
  anonymous: '익명',
};

export type Member = {
  id: number;
  churchId: number;
  name: string;
  phone: string | null;
  birth: string | null;
  lifecycleStage: LifecycleStage;
  note: string | null;
  registeredAt: string | null;
  baptizedAt: string | null;
  confirmedAt: string | null;
  previousChurch: string | null;
  faithYears: number | null;
  registrationReason: string | null;
  occupation: string | null;
  address: string | null;
  rawDonorName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StageCounts = Record<LifecycleStage | 'all', number>;

export type ListMembersResponse = {
  items: Member[];
  total: number;
  page: number;
  pageSize: number;
  counts: StageCounts;
};

export type ListMembersQuery = {
  q?: string;
  stage?: LifecycleStage[];
  page?: number;
  pageSize?: number;
};

export async function listMembers(query: ListMembersQuery): Promise<ListMembersResponse> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.stage && query.stage.length > 0) params.set('stage', query.stage.join(','));
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));

  const res = await fetch(`/api/members?${params}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`list members ${res.status}`);
  return res.json();
}

export type CreateMemberPayload = {
  name: string;
  phone?: string;
  birth?: string;
  lifecycleStage?: LifecycleStage;
  note?: string;
  previousChurch?: string;
  faithYears?: number;
  registrationReason?: string;
  occupation?: string;
  address?: string;
};

export async function createMember(payload: CreateMemberPayload): Promise<Member> {
  const res = await fetch('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`create member ${res.status} ${text}`);
  }
  return res.json();
}

export async function deleteMember(id: number): Promise<void> {
  const res = await fetch(`/api/members/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`delete member ${res.status}`);
}

export type MemberDetail = Member & {
  affiliations: {
    departments: AffiliationSummary[];
    ministries: AffiliationSummary[];
    smallGroups: AffiliationSummary[];
  };
  position: {
    current: PositionHistoryEntry | null;
    history: PositionHistoryEntry[];
  };
};

export type PositionHistoryEntry = {
  id: number;
  positionId: number;
  positionName: string | null;
  startDate: string;
  endDate: string | null;
  note: string | null;
  isCurrent: boolean;
};

export type AffiliationSummary = {
  id: number;
  refId: number;
  refName: string | null;
  startDate: string;
  isLeader: boolean;
  roleLabel: string | null;
};

export async function fetchMember(id: number): Promise<MemberDetail> {
  const res = await fetch(`/api/members/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`fetch member ${res.status}`);
  return res.json();
}
