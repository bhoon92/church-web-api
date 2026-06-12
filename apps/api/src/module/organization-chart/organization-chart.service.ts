import { Injectable } from '@nestjs/common';
import { In, IsNull, ObjectLiteral, Repository } from 'typeorm';
import { DataSources } from '@src/database/data-sources';
import { DepartmentEntity } from '@src/database/entities/department.entity';
import { MemberDepartmentEntity } from '@src/database/entities/member-department.entity';
import { MemberMinistryEntity } from '@src/database/entities/member-ministry.entity';
import { MemberSmallGroupEntity } from '@src/database/entities/member-small-group.entity';
import { MemberEntity } from '@src/database/entities/member.entity';
import { MinistryEntity } from '@src/database/entities/ministry.entity';
import { SmallGroupEntity } from '@src/database/entities/small-group.entity';

/**
 * 조직도 (planning 3) — 별도 트리 데이터를 두지 않고 재적의 활성 소속 조인에서 derive.
 * 단위(부서/사역팀/목장) 마다 리더(isLeader)와 일반 구성원을 분리해 반환.
 * 읽기 전용: 편집은 재적 상세의 소속/리더 관리(AffiliationModule)에서 수행.
 */
export type OrganizationKind = 'department' | 'ministry' | 'smallGroup';

type JoinRow = ObjectLiteral & {
  memberId: number;
  endDate?: string | null;
  isLeader: boolean;
  roleLabel?: string | null;
};

type ReferenceRow = { id: number; name: string; sortOrder: number; isActive: boolean };

type EntityClass<T> = { new (): T };

type Config = {
  joinEntity: EntityClass<JoinRow>;
  referenceEntity: EntityClass<ReferenceRow & ObjectLiteral>;
  referenceKey: keyof JoinRow;
};

const CONFIG: Record<OrganizationKind, Config> = {
  department: { joinEntity: MemberDepartmentEntity, referenceEntity: DepartmentEntity, referenceKey: 'departmentId' },
  ministry: { joinEntity: MemberMinistryEntity, referenceEntity: MinistryEntity, referenceKey: 'ministryId' },
  smallGroup: { joinEntity: MemberSmallGroupEntity, referenceEntity: SmallGroupEntity, referenceKey: 'smallGroupId' },
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

@Injectable()
export class OrganizationChartService {
  async tree(churchId: number): Promise<Record<OrganizationKind, OrganizationUnit[]>> {
    const [department, ministry, smallGroup] = await Promise.all([
      this.section('department', churchId),
      this.section('ministry', churchId),
      this.section('smallGroup', churchId),
    ]);
    return { department, ministry, smallGroup };
  }

  private async section(kind: OrganizationKind, churchId: number): Promise<OrganizationUnit[]> {
    const config = CONFIG[kind];
    const joinRepo = DataSources.instance.getRepository(config.joinEntity) as Repository<JoinRow>;
    const referenceRepo = DataSources.instance.getRepository(config.referenceEntity);
    const memberRepo = DataSources.instance.getRepository(MemberEntity);

    const [references, joins] = await Promise.all([
      referenceRepo.find({
        where: { churchId, isActive: true } as never,
        order: { sortOrder: 'ASC', name: 'ASC' } as never,
      }) as Promise<ReferenceRow[]>,
      joinRepo.find({ where: { churchId, endDate: IsNull() } as never }),
    ]);

    const memberIds = [...new Set(joins.map(joinRow => joinRow.memberId))];
    const members = memberIds.length ? await memberRepo.find({ where: { id: In(memberIds) } }) : [];
    const memberMap = new Map(members.map(member => [member.id, member]));

    const bucket = new Map<number, { leader: OrganizationPerson[]; member: OrganizationPerson[] }>();
    for (const reference of references) bucket.set(reference.id, { leader: [], member: [] });

    for (const joinRow of joins) {
      const slot = bucket.get(joinRow[config.referenceKey] as number);
      const member = memberMap.get(joinRow.memberId);
      if (!slot || !member) continue;
      const person: OrganizationPerson = { memberId: member.id, name: member.name, roleLabel: joinRow.roleLabel ?? null };
      (joinRow.isLeader ? slot.leader : slot.member).push(person);
    }

    const byName = (left: OrganizationPerson, right: OrganizationPerson) => left.name.localeCompare(right.name, 'ko');
    return references.map(reference => {
      const slot = bucket.get(reference.id)!;
      slot.leader.sort(byName);
      slot.member.sort(byName);
      return {
        referenceId: reference.id,
        referenceName: reference.name,
        leader: slot.leader,
        member: slot.member,
        total: slot.leader.length + slot.member.length,
      };
    });
  }
}
