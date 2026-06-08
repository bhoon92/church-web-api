import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSources } from '@src/database/data-sources';
import { AccountEntity } from '@src/database/entities/account.entity';
import { MembershipEntity, MembershipRole } from '@src/database/entities/membership.entity';

export type TeamMember = {
  membershipId: number;
  accountId: number;
  email: string;
  name: string;
  role: MembershipRole;
  pending: boolean;
};

@Injectable()
export class TeamService {
  private membershipRepo() {
    return DataSources.instance.getRepository(MembershipEntity);
  }
  private accountRepo() {
    return DataSources.instance.getRepository(AccountEntity);
  }

  async list(churchId: number): Promise<TeamMember[]> {
    const memberships = await this.membershipRepo().find({ where: { churchId }, order: { id: 'ASC' } });
    if (memberships.length === 0) return [];
    const accounts = await this.accountRepo().find({ where: memberships.map(m => ({ id: m.accountId })) });
    const accMap = new Map(accounts.map(a => [a.id, a]));
    return memberships.map(m => {
      const a = accMap.get(m.accountId);
      return {
        membershipId: m.id,
        accountId: m.accountId,
        email: a?.email ?? '(알 수 없음)',
        name: a?.name ?? '(알 수 없음)',
        role: m.role,
        pending: a?.googleId?.startsWith('pending:') ?? false,
      };
    });
  }

  /** 이메일로 초대 — 미가입이면 pending account 생성, 로그인 시 클레임. */
  async invite(churchId: number, email: string, role: MembershipRole): Promise<TeamMember> {
    if (role === MembershipRole.OWNER) {
      throw new BadRequestException('소유자 역할로는 초대할 수 없습니다.');
    }
    const normalized = email.trim().toLowerCase();

    let account = await this.accountRepo().findOne({ where: { email: normalized } });
    if (!account) {
      account = await this.accountRepo().save(
        this.accountRepo().create({
          googleId: `pending:${normalized}`,
          email: normalized,
          name: normalized.split('@')[0],
        })
      );
    }

    const existing = await this.membershipRepo().findOne({ where: { accountId: account.id, churchId } });
    if (existing) {
      throw new ConflictException('이미 이 교회의 멤버입니다.');
    }

    const membership = await this.membershipRepo().save(this.membershipRepo().create({ accountId: account.id, churchId, role }));
    return {
      membershipId: membership.id,
      accountId: account.id,
      email: account.email,
      name: account.name,
      role: membership.role,
      pending: account.googleId.startsWith('pending:'),
    };
  }

  async updateRole(churchId: number, membershipId: number, role: MembershipRole): Promise<void> {
    const m = await this.membershipRepo().findOne({ where: { id: membershipId, churchId } });
    if (!m) throw new NotFoundException('멤버를 찾을 수 없습니다.');
    if (m.role === MembershipRole.OWNER || role === MembershipRole.OWNER) {
      throw new ForbiddenException('소유자 역할은 변경할 수 없습니다.');
    }
    await this.membershipRepo().update(m.id, { role });
  }

  async remove(churchId: number, membershipId: number): Promise<void> {
    const m = await this.membershipRepo().findOne({ where: { id: membershipId, churchId } });
    if (!m) throw new NotFoundException('멤버를 찾을 수 없습니다.');
    if (m.role === MembershipRole.OWNER) {
      throw new ForbiddenException('소유자는 제거할 수 없습니다.');
    }
    await this.membershipRepo().softDelete(m.id);
  }
}
