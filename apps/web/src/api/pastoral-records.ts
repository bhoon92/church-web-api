export type PastoralRecordType = 'visit' | 'newcomer_education' | 'counsel' | 'etc';

export const PASTORAL_RECORD_TYPES: PastoralRecordType[] = ['visit', 'newcomer_education', 'counsel', 'etc'];

export const PASTORAL_RECORD_TYPE_LABEL: Record<PastoralRecordType, string> = {
  visit: '심방',
  newcomer_education: '새가족교육',
  counsel: '상담',
  etc: '기타',
};

export type PastoralRecord = {
  id: number;
  type: PastoralRecordType;
  date: string;
  location: string | null;
  content: string;
  prayerRequest: string | null;
  statusNote: string | null;
  recorderAccountId: number;
  recorderName: string | null;
  createdAt: string;
};

export type CreatePastoralRecordPayload = {
  type?: PastoralRecordType;
  date?: string;
  location?: string;
  content: string;
  prayerRequest?: string;
  statusNote?: string;
};

export async function listPastoralRecords(memberId: number): Promise<PastoralRecord[]> {
  const res = await fetch(`/api/members/${memberId}/pastoral-records`, { credentials: 'include' });
  if (!res.ok) throw new Error(`list pastoral records ${res.status}`);
  return res.json();
}

export async function createPastoralRecord(memberId: number, payload: CreatePastoralRecordPayload): Promise<PastoralRecord> {
  const res = await fetch(`/api/members/${memberId}/pastoral-records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`create pastoral record ${res.status} ${text}`);
  }
  return res.json();
}

export async function deletePastoralRecord(memberId: number, id: number): Promise<void> {
  const res = await fetch(`/api/members/${memberId}/pastoral-records/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`delete pastoral record ${res.status}`);
}
