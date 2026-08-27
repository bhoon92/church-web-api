export type OrganizationKind = 'department' | 'ministry' | 'smallGroup';

export const ORGANIZATION_KIND: OrganizationKind[] = ['department', 'ministry', 'smallGroup'];

export const ORGANIZATION_KIND_LABEL: Record<OrganizationKind, string> = {
  department: '기관',
  ministry: '사역팀',
  smallGroup: '공동체',
};

export type OrganizationPerson = {
  memberId: number;
  name: string;
  roleLabel: string | null;
};

export type OrganizationUnit = {
  referenceId: number;
  referenceName: string;
  leader: OrganizationPerson[];
  member: OrganizationPerson[];
  total: number;
};

export type OrganizationChart = Record<OrganizationKind, OrganizationUnit[]>;

export async function fetchOrganizationChart(year: number): Promise<OrganizationChart> {
  const res = await fetch(`/api/organization-chart?year=${year}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`organization-chart ${res.status}`);
  return res.json();
}
