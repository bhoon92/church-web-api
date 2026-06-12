import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Mail, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import {
  ASSIGNABLE_ROLES,
  ROLE_LABEL,
  inviteMember,
  listTeam,
  removeMember,
  updateMemberRole,
  type Role,
  type TeamMember,
} from '@/api/team'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/page-header'
import { usePermissions } from '@/lib/permissions'

export function TeamPage() {
  const { can } = usePermissions()
  const canManage = can('team:manage')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <Link to="/app/settings" className="inline-flex items-center gap-1 hover:text-[var(--color-foreground)]">
          <ArrowLeft className="size-3.5" />
          설정으로
        </Link>
      </div>

      <PageHeader eyebrow="설정" title="팀원 / 권한" description="이메일로 초대하고 역할을 부여합니다." />

      {canManage ? (
        <TeamManager />
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
            팀원 관리는 소유자·관리자만 가능합니다.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TeamManager() {
  const queryClient = useQueryClient()
  const { data: members = [], isLoading } = useQuery({ queryKey: ['team'], queryFn: listTeam })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['team'] })

  return (
    <div className="space-y-4">
      <InviteForm onDone={invalidate} />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">불러오는 중…</div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {members.map((member) => (
                <MemberRow key={member.membershipId} member={member} onChanged={invalidate} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('staff')
  const [error, setError] = useState<string | null>(null)

  const inviteMut = useMutation({
    mutationFn: () => inviteMember(email.trim(), role),
    onMutate: () => setError(null),
    onSuccess: () => {
      setEmail('')
      onDone()
    },
    onError: (error: Error) => setError(error.message),
  })

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <Input
              type="email"
              placeholder="초대할 이메일"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="pl-9"
            />
          </div>
          <RoleSelect value={role} onChange={setRole} />
          <Button onClick={() => inviteMut.mutate()} disabled={!email.trim() || inviteMut.isPending}>
            초대
          </Button>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <p className="text-xs text-[var(--color-muted-foreground)]">
          미가입자는 해당 이메일로 Google 로그인 시 자동으로 합류합니다.
        </p>
      </CardContent>
    </Card>
  )
}

function MemberRow({ member, onChanged }: { member: TeamMember; onChanged: () => void }) {
  const isOwner = member.role === 'owner'

  const roleMut = useMutation({
    mutationFn: (role: Role) => updateMemberRole(member.membershipId, role),
    onSuccess: onChanged,
  })
  const removeMut = useMutation({
    mutationFn: () => removeMember(member.membershipId),
    onSuccess: onChanged,
  })

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{member.name}</span>
          {member.pending && <Badge tone="warn">초대됨</Badge>}
        </div>
        <div className="truncate text-xs text-[var(--color-muted-foreground)]">{member.email}</div>
      </div>

      {isOwner ? (
        <Badge tone="neutral">{ROLE_LABEL.owner}</Badge>
      ) : (
        <>
          <RoleSelect value={member.role} onChange={(role) => roleMut.mutate(role)} disabled={roleMut.isPending} />
          <Button
            size="icon"
            variant="ghost"
            aria-label="제거"
            onClick={() => {
              if (window.confirm(`${member.name} 님을 제거할까요?`)) removeMut.mutate()
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      )}
    </li>
  )
}

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: Role
  onChange: (role: Role) => void
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as Role)}
      disabled={disabled}
      className="h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none focus:border-[var(--color-foreground)] disabled:opacity-50"
    >
      {ASSIGNABLE_ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABEL[role]}
        </option>
      ))}
    </select>
  )
}
