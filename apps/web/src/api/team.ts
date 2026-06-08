export type Role = 'owner' | 'admin' | 'staff' | 'viewer';

export const ROLE_LABEL: Record<Role, string> = {
  owner: '소유자',
  admin: '관리자',
  staff: '실무자',
  viewer: '조회',
};

/** 초대/변경 가능한 역할 (소유자 제외). */
export const ASSIGNABLE_ROLES: Role[] = ['admin', 'staff', 'viewer'];

export type TeamMember = {
  membershipId: number;
  accountId: number;
  email: string;
  name: string;
  role: Role;
  pending: boolean;
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

async function send<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `${res.status}`;
    try {
      const b = await res.json();
      if (b?.message) message = String(Array.isArray(b.message) ? b.message.join(', ') : b.message).replace(/^\w*Exception:\s*/, '');
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const listTeam = () => getJson<TeamMember[]>('/api/team');
export const inviteMember = (email: string, role: Role) => send<TeamMember>('POST', '/api/team/invite', { email, role });
export const updateMemberRole = (membershipId: number, role: Role) => send<void>('PATCH', `/api/team/${membershipId}`, { role });
export const removeMember = (membershipId: number) => send<void>('DELETE', `/api/team/${membershipId}`);
