export type ReferenceKind = 'department' | 'ministry' | 'smallGroup' | 'position' | 'worshipService' | 'memberStatus';

export const REFERENCE_PATH: Record<ReferenceKind, string> = {
  department: 'departments',
  ministry: 'ministries',
  smallGroup: 'small-groups',
  position: 'positions',
  worshipService: 'worship-services',
  memberStatus: 'member-statuses',
};

export const REFERENCE_LABEL: Record<ReferenceKind, string> = {
  department: '부서',
  ministry: '사역팀',
  smallGroup: '목장',
  position: '직분',
  worshipService: '예배',
  memberStatus: '재적상태',
};

// 연도별로 편성하는 reference (해마다 재편성). 나머지(직분·예배)는 연도 무관 공통.
export const YEAR_SCOPED_KINDS = new Set<ReferenceKind>(['department', 'ministry', 'smallGroup']);

export type Reference = {
  id: number;
  churchId: number;
  year?: number;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpsertReferencePayload = {
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export async function listReferences(kind: ReferenceKind, year?: number): Promise<Reference[]> {
  const query = year != null ? `?year=${year}` : '';
  const res = await fetch(`/api/${REFERENCE_PATH[kind]}${query}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`list ${kind} ${res.status}`);
  return res.json();
}

export async function createReference(kind: ReferenceKind, payload: UpsertReferencePayload, year?: number): Promise<Reference> {
  const query = year != null ? `?year=${year}` : '';
  const res = await fetch(`/api/${REFERENCE_PATH[kind]}${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`create ${kind} ${res.status} ${text}`);
  }
  return res.json();
}

// 이전 연도(fromYear) 구성을 새 연도(toYear)로 복제.
export async function copyReferenceYear(kind: ReferenceKind, fromYear: number, toYear: number): Promise<Reference[]> {
  const res = await fetch(`/api/${REFERENCE_PATH[kind]}/copy?from=${fromYear}&to=${toYear}`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`copy ${kind} ${res.status} ${text}`);
  }
  return res.json();
}

export async function updateReference(kind: ReferenceKind, id: number, payload: Partial<UpsertReferencePayload>): Promise<Reference> {
  const res = await fetch(`/api/${REFERENCE_PATH[kind]}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`update ${kind} ${res.status}`);
  return res.json();
}

export async function deleteReference(kind: ReferenceKind, id: number): Promise<void> {
  const res = await fetch(`/api/${REFERENCE_PATH[kind]}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`delete ${kind} ${res.status}`);
}
