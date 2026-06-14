export type Member = {
  id: number;
  churchId: number;
  name: string;
  phone: string | null;
  birth: string | null;
  statusId: number;
  statusName: string | null;
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

export type MemberStatusCount = { id: number; name: string; count: number };
export type MemberCounts = { all: number; byStatus: MemberStatusCount[] };

export type ListMembersResponse = {
  items: Member[];
  total: number;
  page: number;
  pageSize: number;
  counts: MemberCounts;
};

export type AffiliationKind = 'department' | 'ministry' | 'smallGroup';

export type ListMembersQuery = {
  q?: string;
  statusId?: number;
  affiliationKind?: AffiliationKind;
  affiliationId?: number;
  page?: number;
  pageSize?: number;
};

export async function listMembers(query: ListMembersQuery): Promise<ListMembersResponse> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.statusId) params.set('statusId', String(query.statusId));
  if (query.affiliationKind && query.affiliationId) {
    params.set('affiliationKind', query.affiliationKind);
    params.set('affiliationId', String(query.affiliationId));
  }
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
  statusId?: number;
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

export type UpdateMemberPayload = Partial<Omit<CreateMemberPayload, 'phone'>> & { phone?: string | null };

export async function updateMember(id: number, payload: UpdateMemberPayload): Promise<Member> {
  const res = await fetch(`/api/members/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`update member ${res.status} ${text}`);
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
  referenceId: number;
  referenceName: string | null;
  startDate: string;
  isLeader: boolean;
  roleLabel: string | null;
};

export async function fetchMember(id: number): Promise<MemberDetail> {
  const res = await fetch(`/api/members/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`fetch member ${res.status}`);
  return res.json();
}
