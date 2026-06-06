import { REF_PATH } from './references';

/** Affiliation 은 부서/사역팀/목장만 — Position 은 별도 endpoint. */
export type AffiliationKind = 'department' | 'ministry' | 'smallGroup';

export type Affiliation = {
  id: number;
  refId: number;
  refName: string | null;
  startDate: string;
  isLeader: boolean;
  roleLabel: string | null;
};

export type AssignAffiliationPayload = {
  refId: number;
  isLeader?: boolean;
  roleLabel?: string;
  startDate?: string;
};

export async function assignAffiliation(memberId: number, kind: AffiliationKind, payload: AssignAffiliationPayload): Promise<unknown> {
  const res = await fetch(`/api/members/${memberId}/${REF_PATH[kind]}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`assign ${kind} ${res.status} ${text}`);
  }
  return res.json();
}

export async function endAffiliation(memberId: number, kind: AffiliationKind, refId: number): Promise<void> {
  const res = await fetch(`/api/members/${memberId}/${REF_PATH[kind]}/${refId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`end ${kind} ${res.status}`);
}
