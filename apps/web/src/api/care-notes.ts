export type CareNoteType = 'visit' | 'meeting' | 'nurture' | 'counsel' | 'field_report' | 'etc';

/** 화면에 나오는 순서이자 새 기록의 기본값(첫 항목). */
export const CARE_NOTE_TYPES: CareNoteType[] = ['visit', 'meeting', 'nurture', 'counsel', 'field_report', 'etc'];

export const CARE_NOTE_TYPE_LABEL: Record<CareNoteType, string> = {
  visit: '심방',
  meeting: '면담',
  nurture: '양육',
  counsel: '상담',
  field_report: '파송보고',
  etc: '기타',
};

export type CareNote = {
  id: number;
  type: CareNoteType;
  date: string;
  location: string | null;
  content: string;
  prayerRequest: string | null;
  statusNote: string | null;
  recorderAccountId: number;
  recorderName: string | null;
  createdAt: string;
};

export type CreateCareNotePayload = {
  type?: CareNoteType;
  date?: string;
  location?: string;
  content: string;
  prayerRequest?: string;
  statusNote?: string;
};

export async function listCareNotes(memberId: number): Promise<CareNote[]> {
  const res = await fetch(`/api/members/${memberId}/care-notes`, { credentials: 'include' });
  if (!res.ok) throw new Error(`list care notes ${res.status}`);
  return res.json();
}

export async function createCareNote(memberId: number, payload: CreateCareNotePayload): Promise<CareNote> {
  const res = await fetch(`/api/members/${memberId}/care-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`create care note ${res.status} ${text}`);
  }
  return res.json();
}

export async function deleteCareNote(memberId: number, id: number): Promise<void> {
  const res = await fetch(`/api/members/${memberId}/care-notes/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`delete care note ${res.status}`);
}
