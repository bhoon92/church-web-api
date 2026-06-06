import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { IsNull, ObjectLiteral, Repository } from 'typeorm';
import { DataSources } from '@src/database/data-sources';
import { DepartmentEntity } from '@src/database/entities/department.entity';
import { MemberDepartmentEntity } from '@src/database/entities/member-department.entity';
import { MemberMinistryEntity } from '@src/database/entities/member-ministry.entity';
import { MemberSmallGroupEntity } from '@src/database/entities/member-small-group.entity';
import { MemberEntity } from '@src/database/entities/member.entity';
import { MinistryEntity } from '@src/database/entities/ministry.entity';
import { SmallGroupEntity } from '@src/database/entities/small-group.entity';
import { AssignAffiliationDto } from './dto/assign.dto';

export type AffiliationKind = 'department' | 'ministry' | 'smallGroup';

type JoinRow = ObjectLiteral & {
  id: number;
  churchId: number;
  memberId: number;
  startDate: string;
  endDate?: string | null;
  isLeader: boolean;
  roleLabel?: string | null;
};

type EntityClass<T> = { new (): T };

type Config<J extends JoinRow, R extends ObjectLiteral> = {
  joinEntity: EntityClass<J>;
  refEntity: EntityClass<R>;
  refKey: keyof J; // e.g., 'departmentId'
};

const CONFIGS = {
  department: {
    joinEntity: MemberDepartmentEntity,
    refEntity: DepartmentEntity,
    refKey: 'departmentId' as const,
  },
  ministry: {
    joinEntity: MemberMinistryEntity,
    refEntity: MinistryEntity,
    refKey: 'ministryId' as const,
  },
  smallGroup: {
    joinEntity: MemberSmallGroupEntity,
    refEntity: SmallGroupEntity,
    refKey: 'smallGroupId' as const,
  },
} as const;

@Injectable()
export class AffiliationService {
  async assign(kind: AffiliationKind, churchId: number, memberId: number, dto: AssignAffiliationDto): Promise<JoinRow> {
    const config = CONFIGS[kind] as Config<JoinRow, ObjectLiteral>;
    await this.assertMember(churchId, memberId);
    await this.assertRef(config.refEntity, churchId, dto.refId);

    const joinRepo = DataSources.instance.getRepository(config.joinEntity) as Repository<JoinRow>;

    const existing = await joinRepo.findOne({
      where: {
        churchId,
        memberId,
        [config.refKey]: dto.refId,
        endDate: IsNull(),
      } as never,
    });
    if (existing) {
      throw new ConflictException('이미 활성 소속이 있습니다.');
    }

    const row = new config.joinEntity() as JoinRow;
    Object.assign(row, {
      churchId,
      memberId,
      [config.refKey]: dto.refId,
      startDate: dto.startDate ?? this.today(),
      isLeader: dto.isLeader ?? false,
      roleLabel: dto.roleLabel,
    });
    return joinRepo.save(row);
  }

  async end(kind: AffiliationKind, churchId: number, memberId: number, refId: number): Promise<void> {
    const config = CONFIGS[kind] as Config<JoinRow, ObjectLiteral>;
    const joinRepo = DataSources.instance.getRepository(config.joinEntity) as Repository<JoinRow>;

    const existing = await joinRepo.findOne({
      where: {
        churchId,
        memberId,
        [config.refKey]: refId,
        endDate: IsNull(),
      } as never,
    });
    if (!existing) {
      throw new NotFoundException('활성 소속을 찾을 수 없습니다.');
    }
    await joinRepo.update(existing.id, { endDate: this.today() } as never);
  }

  async listForMember(churchId: number, memberId: number) {
    const [departments, ministries, smallGroups] = await Promise.all([
      this.currentJoins('department', churchId, memberId),
      this.currentJoins('ministry', churchId, memberId),
      this.currentJoins('smallGroup', churchId, memberId),
    ]);
    return { departments, ministries, smallGroups };
  }

  private async currentJoins(kind: AffiliationKind, churchId: number, memberId: number) {
    const config = CONFIGS[kind] as Config<JoinRow, ObjectLiteral>;
    const joinRepo = DataSources.instance.getRepository(config.joinEntity) as Repository<JoinRow>;
    const refRepo = DataSources.instance.getRepository(config.refEntity);

    const joins = await joinRepo.find({
      where: { churchId, memberId, endDate: IsNull() } as never,
      order: { createdAt: 'ASC' } as never,
    });
    if (joins.length === 0) return [];

    const refIds = joins.map(j => j[config.refKey] as number);
    const refs = (await refRepo.find({
      where: { id: refIds.length === 1 ? refIds[0] : (refIds as never) } as never,
    })) as { id: number; name: string }[];
    const refMap = new Map(refs.map(r => [r.id, r]));

    return joins.map(j => {
      const ref = refMap.get(j[config.refKey] as number);
      return {
        id: j.id,
        refId: j[config.refKey],
        refName: ref?.name ?? null,
        startDate: j.startDate,
        isLeader: j.isLeader,
        roleLabel: j.roleLabel ?? null,
      };
    });
  }

  private async assertMember(churchId: number, memberId: number): Promise<void> {
    const m = await DataSources.instance.getRepository(MemberEntity).findOne({ where: { id: memberId, churchId } });
    if (!m) throw new NotFoundException('Member not found');
  }

  private async assertRef<R extends ObjectLiteral>(entity: EntityClass<R>, churchId: number, refId: number): Promise<void> {
    const r = await DataSources.instance.getRepository(entity).findOne({ where: { id: refId, churchId } as never });
    if (!r) throw new BadRequestException('Reference not found in this church');
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
