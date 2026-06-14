import { Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { DataSources } from '@src/database/data-sources';
import { LifecycleStage, MemberEntity } from '@src/database/entities/member.entity';
import { AffiliationService } from '@src/module/affiliation/affiliation.service';
import { MemberPositionService } from '@src/module/position/member-position.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { ListMemberQueryDto } from './dto/list-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

export type StageCount = Record<LifecycleStage | 'all', number>;

@Injectable()
export class MemberService {
  constructor(
    private readonly affiliations: AffiliationService,
    private readonly positions: MemberPositionService
  ) {}

  private repo() {
    return DataSources.instance.getRepository(MemberEntity);
  }

  async create(churchId: number, dto: CreateMemberDto): Promise<MemberEntity> {
    const repo = this.repo();
    const member = repo.create({ ...dto, churchId });
    return repo.save(member);
  }

  async list(
    churchId: number,
    query: ListMemberQueryDto
  ): Promise<{ items: MemberEntity[]; total: number; page: number; pageSize: number; counts: StageCount }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const affiliationMemberIds = await this.resolveAffiliationMemberIds(churchId, query);

    const qb = this.repo().createQueryBuilder('m').where('m.churchId = :churchId', { churchId });
    this.applySearchFilters(qb, query.q, affiliationMemberIds);

    if (query.stage && query.stage.length > 0) {
      qb.andWhere('m.lifecycleStage IN (:...stages)', { stages: query.stage });
    }

    qb.orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    const counts = await this.countByStage(churchId, query.q, affiliationMemberIds);

    return { items, total, page, pageSize, counts };
  }

  /** 소속(부서/사역팀/목장) 필터가 있으면 해당 활성 소속 성도 id 목록, 없으면 null. */
  private async resolveAffiliationMemberIds(churchId: number, query: ListMemberQueryDto): Promise<number[] | null> {
    if (!query.affiliationKind || !query.affiliationId) return null;
    return this.affiliations.memberIdsFor(query.affiliationKind, churchId, query.affiliationId);
  }

  /** 이름·전화 부분일치 + 소속 성도 id 필터를 쿼리에 적용 (list/countByStage 공용). */
  private applySearchFilters(qb: SelectQueryBuilder<MemberEntity>, q?: string, affiliationMemberIds?: number[] | null): void {
    if (q) {
      qb.andWhere(
        new Brackets(builder => {
          builder.where('m.name ILIKE :q', { q: `%${q}%` }).orWhere('m.phone ILIKE :q', { q: `%${q}%` });
        })
      );
    }
    if (affiliationMemberIds) {
      if (affiliationMemberIds.length === 0) qb.andWhere('1 = 0');
      else qb.andWhere('m.id IN (:...affiliationMemberIds)', { affiliationMemberIds });
    }
  }

  /** 엑셀 내보내기용 — 전체 재적 (이름 오름차순). */
  listAll(churchId: number): Promise<MemberEntity[]> {
    return this.repo().find({ where: { churchId }, order: { name: 'ASC', id: 'ASC' } });
  }

  async findById(churchId: number, id: number) {
    const member = await this.repo().findOne({ where: { id, churchId } });
    if (!member) throw new NotFoundException('Member not found');
    const [affiliations, position] = await Promise.all([
      this.affiliations.listForMember(churchId, id),
      this.positions.history(churchId, id),
    ]);
    return { ...member, affiliations, position };
  }

  async update(churchId: number, id: number, dto: UpdateMemberDto) {
    await this.findById(churchId, id);
    await this.repo().update({ id, churchId }, dto);
    return this.findById(churchId, id);
  }

  async remove(churchId: number, id: number): Promise<void> {
    const result = await this.repo().softDelete({ id, churchId });
    if (!result.affected) throw new NotFoundException('Member not found');
  }

  /** UI filter chip 카운트 */
  private async countByStage(churchId: number, q?: string, affiliationMemberIds?: number[] | null): Promise<StageCount> {
    const qb = this.repo()
      .createQueryBuilder('m')
      .select('m.lifecycleStage', 'stage')
      .addSelect('COUNT(*)', 'cnt')
      .where('m.churchId = :churchId', { churchId });

    this.applySearchFilters(qb, q, affiliationMemberIds);

    qb.groupBy('m.lifecycleStage');

    const rows = (await qb.getRawMany()) as { stage: LifecycleStage; cnt: string }[];

    const counts = {
      all: 0,
      [LifecycleStage.VISITOR]: 0,
      [LifecycleStage.NEW]: 0,
      [LifecycleStage.REGULAR]: 0,
      [LifecycleStage.TRANSFERRED]: 0,
      [LifecycleStage.DECEASED]: 0,
      [LifecycleStage.ABSENT]: 0,
      [LifecycleStage.ANONYMOUS]: 0,
    } as StageCount;

    for (const row of rows) {
      const c = Number(row.cnt);
      counts[row.stage] = c;
      counts.all += c;
    }

    return counts;
  }
}
