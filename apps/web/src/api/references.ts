export type ReferenceKind = 'department' | 'ministry' | 'smallGroup' | 'position' | 'worshipService';

export const REF_PATH: Record<ReferenceKind, string> = {
  department: 'departments',
  ministry: 'ministries',
  smallGroup: 'small-groups',
  position: 'positions',
  worshipService: 'worship-services',
};

export const REF_LABEL: Record<ReferenceKind, string> = {
  department: '부서',
  ministry: '사역팀',
  smallGroup: '목장',
  position: '직분',
  worshipService: '예배',
};

export type Reference = {
  id: number;
  churchId: number;
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

export async function listReferences(kind: ReferenceKind): Promise<Reference[]> {
  const res = await fetch(`/api/${REF_PATH[kind]}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`list ${kind} ${res.status}`);
  return res.json();
}

export async function createReference(kind: ReferenceKind, payload: UpsertReferencePayload): Promise<Reference> {
  const res = await fetch(`/api/${REF_PATH[kind]}`, {
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

export async function updateReference(kind: ReferenceKind, id: number, payload: Partial<UpsertReferencePayload>): Promise<Reference> {
  const res = await fetch(`/api/${REF_PATH[kind]}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`update ${kind} ${res.status}`);
  return res.json();
}

export async function deleteReference(kind: ReferenceKind, id: number): Promise<void> {
  const res = await fetch(`/api/${REF_PATH[kind]}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`delete ${kind} ${res.status}`);
}
