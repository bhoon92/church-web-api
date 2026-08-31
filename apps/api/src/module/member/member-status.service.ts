import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSources } from '@src/database/data-sources';
import { MemberEntity } from '@src/database/entities/member.entity';
import { MemberStatusEntity } from '@src/database/entities/member-status.entity';

export type UpsertMemberStatusInput = {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
  /** 정체 판정 기준 일수. null 이면 이 단계는 정체로 보지 않는다. */
  stallsAfterDays?: number | null;
};

/** 재적상태 reference CRUD. 익명(systemKey='anonymous')은 내부용이라 목록에서 제외. */
@Injectable()
export class MemberStatusService {
  private repo() {
    return DataSources.instance.getRepository(MemberStatusEntity);
  }

  /** 관리/선택용 목록 (익명 제외, sortOrder 순). systemKey IS DISTINCT FROM 으로 NULL도 포함. */
  list(churchId: number): Promise<MemberStatusEntity[]> {
    return this.repo()
      .createQueryBuilder('s')
      .where('s.churchId = :churchId', { churchId })
      .andWhere(`s.systemKey IS DISTINCT FROM 'anonymous'`)
      .orderBy('s.sortOrder', 'ASC')
      .addOrderBy('s.id', 'ASC')
      .getMany();
  }

  async create(churchId: number, input: UpsertMemberStatusInput): Promise<MemberStatusEntity> {
    const name = input.name?.trim();
    if (!name) throw new BadRequestException('이름을 입력하세요.');
    const row = this.repo().create({
      churchId,
      name,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
      stallsAfterDays: input.stallsAfterDays ?? null,
    });
    return this.repo().save(row);
  }

  async update(churchId: number, id: number, input: UpsertMemberStatusInput): Promise<MemberStatusEntity> {
    const status = await this.repo().findOne({ where: { id, churchId } });
    if (!status) throw new NotFoundException('재적상태를 찾을 수 없습니다.');
    const patch: UpsertMemberStatusInput = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    // null 을 명시적으로 보내면 "정체 판정 안 함" 이므로 undefined 와 구분해야 한다.
    if (input.stallsAfterDays !== undefined) patch.stallsAfterDays = input.stallsAfterDays;
    await this.repo().update({ id, churchId }, patch);
    return (await this.repo().findOne({ where: { id, churchId } }))!;
  }

  async remove(churchId: number, id: number): Promise<void> {
    const status = await this.repo().findOne({ where: { id, churchId } });
    if (!status) throw new NotFoundException('재적상태를 찾을 수 없습니다.');
    if (status.systemKey) throw new ConflictException('시스템 상태는 삭제할 수 없습니다.');
    const inUse = await DataSources.instance.getRepository(MemberEntity).count({ where: { churchId, statusId: id } });
    if (inUse > 0) throw new ConflictException(`이 상태인 성도가 ${inUse}명 있어 삭제할 수 없습니다.`);
    await this.repo().softDelete({ id, churchId });
  }
}
