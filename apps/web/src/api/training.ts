const BASE = '/api/training';

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

export type TrainingFormat = 'weekly' | 'retreat' | 'intensive' | 'etc';

export const TRAINING_FORMAT_LABEL: Record<TrainingFormat, string> = {
  weekly: '매주',
  retreat: '수련회',
  intensive: '합숙',
  etc: '기타',
};

export type CohortStatus = 'planned' | 'ongoing' | 'closed';

export const COHORT_STATUS_LABEL: Record<CohortStatus, string> = {
  planned: '예정',
  ongoing: '진행 중',
  closed: '종료',
};

export type EnrollmentStatus = 'enrolled' | 'completed' | 'dropped';

export const ENROLLMENT_STATUS_LABEL: Record<EnrollmentStatus, string> = {
  enrolled: '수강 중',
  completed: '수료',
  dropped: '중도포기',
};

export type TrainingCourse = {
  id: number;
  name: string;
  format: TrainingFormat;
  defaultSessionCount: number;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type Cohort = {
  id: number;
  courseId: number;
  courseName: string;
  ordinal: number;
  label: string;
  startDate: string;
  endDate: string | null;
  status: CohortStatus;
  leaderMemberId: number | null;
  leaderName: string | null;
  sessionCount: number;
  enrolledCount: number;
  completedCount: number;
};

export type CohortSession = {
  id: number;
  sequence: number;
  date: string | null;
  topic: string | null;
};

export type CohortRosterItem = {
  enrollmentId: number;
  memberId: number;
  memberName: string;
  status: EnrollmentStatus;
  attendedSessionIds: number[];
  attendanceRate: number;
};

export type CohortDetail = {
  sessions: CohortSession[];
  roster: CohortRosterItem[];
};

export type MemberTrainingHistory = {
  enrollmentId: number;
  cohortId: number;
  courseName: string;
  ordinal: number;
  label: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  closedAt: string | null;
  attendanceRate: number;
};

export const listCourses = () => request<TrainingCourse[]>(`${BASE}/courses`);

export const createCourse = (payload: { name: string; format?: TrainingFormat; defaultSessionCount?: number; description?: string }) =>
  request<TrainingCourse>(`${BASE}/courses`, { method: 'POST', body: JSON.stringify(payload) });

export const updateCourse = (id: number, payload: Partial<{ name: string; defaultSessionCount: number; isActive: boolean }>) =>
  request<TrainingCourse>(`${BASE}/courses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const listCohorts = (params?: { courseId?: number; status?: CohortStatus }) => {
  const query = new URLSearchParams();
  if (params?.courseId) query.set('courseId', String(params.courseId));
  if (params?.status) query.set('status', params.status);
  const suffix = query.toString() ? `?${query}` : '';
  return request<Cohort[]>(`${BASE}/cohorts${suffix}`);
};

export const createCohort = (payload: {
  courseId: number;
  startDate: string;
  endDate?: string;
  sessionCount?: number;
  leaderMemberId?: number;
}) => request<Cohort>(`${BASE}/cohorts`, { method: 'POST', body: JSON.stringify(payload) });

export const fetchCohortDetail = (cohortId: number) => request<CohortDetail>(`${BASE}/cohorts/${cohortId}`);

export const updateCohort = (cohortId: number, payload: Partial<{ status: CohortStatus; startDate: string; endDate: string }>) =>
  request<Cohort>(`${BASE}/cohorts/${cohortId}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteCohort = (cohortId: number) => request<void>(`${BASE}/cohorts/${cohortId}`, { method: 'DELETE' });

export const updateSession = (sessionId: number, payload: { date?: string; topic?: string }) =>
  request<CohortSession>(`${BASE}/cohorts/sessions/${sessionId}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const addSession = (cohortId: number) => request<CohortSession>(`${BASE}/cohorts/${cohortId}/sessions`, { method: 'POST' });

export const markTrainingAttendance = (sessionId: number, enrollmentId: number, present: boolean) =>
  request<{ present: boolean }>(`${BASE}/cohorts/sessions/${sessionId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({ enrollmentId, present }),
  });

export const enrollMembers = (cohortId: number, memberIds: number[]) =>
  request<{ added: number; skipped: number }>(`${BASE}/cohorts/${cohortId}/enrollments`, {
    method: 'POST',
    body: JSON.stringify({ memberIds }),
  });

export const updateEnrollmentStatus = (enrollmentId: number, status: EnrollmentStatus) =>
  request<unknown>(`${BASE}/enrollments/${enrollmentId}`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const removeEnrollment = (enrollmentId: number) => request<void>(`${BASE}/enrollments/${enrollmentId}`, { method: 'DELETE' });

export const fetchMemberTrainingHistory = (memberId: number) => request<MemberTrainingHistory[]>(`${BASE}/members/${memberId}`);
