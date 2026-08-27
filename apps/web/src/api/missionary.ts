const BASE = '/api/missionaries';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${init?.method ?? 'GET'} ${url} ${res.status} ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export type MissionaryStage = 'candidate' | 'training' | 'commissioned' | 'field' | 'furlough' | 'returned' | 'ended';

/** 파이프라인 순서대로. UI 의 단계 선택·정렬에 그대로 쓴다. */
export const MISSIONARY_STAGES: MissionaryStage[] = ['candidate', 'training', 'commissioned', 'field', 'furlough', 'returned', 'ended'];

export const MISSIONARY_STAGE_LABEL: Record<MissionaryStage, string> = {
  candidate: '후보',
  training: '훈련 중',
  commissioned: '파송 확정',
  field: '현지 사역',
  furlough: '안식년',
  returned: '복귀',
  ended: '종료',
};

/** 서버의 ACTIVE_MISSIONARY_STAGES 와 같은 기준 (현재 파송 인원). */
export const ACTIVE_STAGES: MissionaryStage[] = ['commissioned', 'field', 'furlough'];

export type Missionary = {
  id: number;
  memberId: number;
  memberName: string;
  stage: MissionaryStage;
  country: string | null;
  region: string | null;
  fieldWork: string | null;
  ministryId: number | null;
  ministryName: string | null;
  commissionedAt: string | null;
  departedAt: string | null;
  endedAt: string | null;
  note: string | null;
};

export type MissionaryStageHistory = {
  id: number;
  fromStage: MissionaryStage | null;
  toStage: MissionaryStage;
  changedAt: string;
  note: string | null;
};

export type MissionarySummary = {
  active: number;
  byStage: Record<MissionaryStage, number>;
  commissionedThisYear: number;
};

export const listMissionaries = (params?: { stage?: MissionaryStage; scope?: 'active' | 'all' }) => {
  const query = new URLSearchParams();
  if (params?.stage) query.set('stage', params.stage);
  if (params?.scope) query.set('scope', params.scope);
  const suffix = query.toString() ? `?${query}` : '';
  return request<Missionary[]>(`${BASE}${suffix}`);
};

export const fetchMissionarySummary = () => request<MissionarySummary>(`${BASE}/summary`);

export const fetchMissionaryDetail = (id: number) => request<Missionary & { history: MissionaryStageHistory[] }>(`${BASE}/${id}`);

export const fetchMissionaryByMember = (memberId: number) => request<Missionary | null>(`${BASE}/by-member/${memberId}`);

export const createMissionary = (payload: {
  memberId: number;
  stage?: MissionaryStage;
  country?: string;
  region?: string;
  fieldWork?: string;
}) => request<Missionary>(BASE, { method: 'POST', body: JSON.stringify(payload) });

export const updateMissionary = (id: number, payload: Partial<{ country: string; region: string; fieldWork: string; note: string }>) =>
  request<Missionary>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const changeMissionaryStage = (id: number, stage: MissionaryStage, note?: string) =>
  request<Missionary>(`${BASE}/${id}/stage`, { method: 'POST', body: JSON.stringify({ stage, note }) });

export const removeMissionary = (id: number) => request<void>(`${BASE}/${id}`, { method: 'DELETE' });
