async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

export type HomeScheduleItem = {
  id: number;
  title: string;
  startAt: string;
  allDay: boolean;
  layer: string;
  color: string;
};

export type HomeActivityItem = {
  kind: 'offering' | 'member' | 'transaction';
  who: string;
  what: string;
  at: string;
};

export type HomeDashboard = {
  stats: {
    weeklyAttendance: number;
    monthlyOffering: number;
    newMembers: number;
    budgetRate: number | null;
  };
  schedule: HomeScheduleItem[];
  activity: HomeActivityItem[];
};

export const fetchHomeDashboard = () => getJson<HomeDashboard>('/api/dashboard');
