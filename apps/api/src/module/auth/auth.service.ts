import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSources } from '@src/database/data-sources';
import { AccountEntity } from '@src/database/entities/account.entity';
import { ChurchEntity } from '@src/database/entities/church.entity';
import { MembershipEntity, MembershipRole } from '@src/database/entities/membership.entity';
import type { GoogleProfile } from './strategies/google.strategy';
import type { AuthContext, JwtPayload } from './types/auth-context';

export type SessionResult = {
  account: AccountEntity;
  memberships: MembershipEntity[];
  token: string;
  activeChurchId: number | null;
  activeRole: MembershipRole | null;
};

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  /** Google/dev 로그인 공통 진입점: upsert Account → memberships 조회 → JWT 발급 */
  async upsertAndIssueSession(profile: GoogleProfile): Promise<SessionResult> {
    const accountRepo = DataSources.instance.getRepository(AccountEntity);
    const membershipRepo = DataSources.instance.getRepository(MembershipEntity);

    let account = await accountRepo.findOne({ where: { googleId: profile.googleId } });

    // 초대로 미리 만들어진 pending 계정(googleId 미연결)을 이메일로 클레임
    if (!account) {
      const byEmail = await accountRepo.findOne({ where: { email: profile.email } });
      if (byEmail) {
        await accountRepo.update(byEmail.id, {
          googleId: profile.googleId,
          name: profile.name,
          pictureUrl: profile.pictureUrl,
          lastLoginAt: new Date(),
        });
        account = (await accountRepo.findOne({ where: { id: byEmail.id } }))!;
      }
    }

    if (!account) {
      account = await accountRepo.save(
        accountRepo.create({
          googleId: profile.googleId,
          email: profile.email,
          name: profile.name,
          pictureUrl: profile.pictureUrl,
          lastLoginAt: new Date(),
        })
      );
    } else {
      await accountRepo.update(account.id, {
        email: profile.email,
        name: profile.name,
        pictureUrl: profile.pictureUrl,
        lastLoginAt: new Date(),
      });
      account = (await accountRepo.findOne({ where: { id: account.id } }))!;
    }

    const memberships = await membershipRepo.find({
      where: { accountId: account.id },
    });

    // 멤버십이 정확히 1개면 자동으로 그 교회를 활성
    const auto = memberships.length === 1 ? memberships[0] : null;
    const activeChurchId = auto?.churchId ?? null;
    const activeRole = auto?.role ?? null;

    const token = await this.signToken({
      accountId: account.id,
      churchId: activeChurchId,
      role: activeRole,
    });

    return { account, memberships, token, activeChurchId, activeRole };
  }

  /** 다교회 소속자가 활성 교회를 바꾸기 / 첫 멤버십을 발급받은 직후 churchId를 JWT에 박기 */
  async selectChurch(accountId: number, churchId: number): Promise<{ token: string; role: MembershipRole }> {
    const membership = await DataSources.instance.getRepository(MembershipEntity).findOne({
      where: { accountId, churchId },
    });
    if (!membership) {
      throw new ForbiddenException('해당 교회에 소속되어 있지 않습니다.');
    }
    const token = await this.signToken({ accountId, churchId, role: membership.role });
    return { token, role: membership.role };
  }

  async me(auth: AuthContext) {
    const accountRepo = DataSources.instance.getRepository(AccountEntity);
    const membershipRepo = DataSources.instance.getRepository(MembershipEntity);
    const churchRepo = DataSources.instance.getRepository(ChurchEntity);

    const account = await accountRepo.findOne({ where: { id: auth.accountId } });
    if (!account) throw new UnauthorizedException('Account not found');

    const memberships = await membershipRepo.find({ where: { accountId: auth.accountId } });

    // 다교회 선택 UI 를 위해 멤버십에 교회 이름 enrich
    const churchIds = memberships.map(membership => membership.churchId);
    const churches = churchIds.length > 0 ? await churchRepo.find({ where: churchIds.map(id => ({ id })) }) : [];
    const churchNameMap = new Map(churches.map(church => [church.id, church.name]));
    const enrichedMemberships = memberships.map(membership => ({
      id: membership.id,
      accountId: membership.accountId,
      churchId: membership.churchId,
      role: membership.role,
      churchName: churchNameMap.get(membership.churchId) ?? null,
    }));

    let currentChurch: ChurchEntity | null = null;
    if (auth.churchId) {
      currentChurch = await churchRepo.findOne({ where: { id: auth.churchId } });
    }

    return { account, memberships: enrichedMemberships, currentChurch, role: auth.role };
  }

  private signToken(payload: JwtPayload): Promise<string> {
    return this.jwt.signAsync({
      accountId: payload.accountId,
      churchId: payload.churchId ?? null,
      role: payload.role ?? null,
    });
  }
}
