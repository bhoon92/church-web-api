import { Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { DataSources } from '@src/database/data-sources';
import { MemberEntity } from '@src/database/entities/member.entity';
import { MemberStatusEntity } from '@src/database/entities/member-status.entity';
import { AffiliationService } from '@src/module/affiliation/affiliation.service';
import { MemberPositionService } from '@src/module/position/member-position.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { ListMemberQueryDto } from './dto/list-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

export type MemberStatusCount = { id: number; name: string; count: number };
export type MemberListCounts = { all: number; byStatus: MemberStatusCount[] };
export type MemberView = MemberEntity & { statusName: string | null };

@Injectable()
export class MemberService {
  constructor(
    private readonly affiliations: AffiliationService,
    private readonly positions: MemberPositionService
  ) {}

  private repo() {
    return DataSources.instance.getRepository(MemberEntity);
  }

  private statusRepo() {
    return DataSources.instance.getRepository(MemberStatusEntity);
  }

  async create(churchId: number, dto: CreateMemberDto): Promise<MemberEntity> {
    const statusId = dto.statusId ?? (await this.defaultStatusId(churchId));
    const member = this.repo().create({ ...dto, statusId, churchId });
    return this.repo().save(member);
  }

  async list(
    churchId: number,
    query: ListMemberQueryDto
  ): Promise<{ items: MemberView[]; total: number; page: number; pageSize: number; counts: MemberListCounts }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const affiliationMemberIds = await this.resolveAffiliationMemberIds(churchId, query);

    const qb = this.repo().createQueryBuilder('m').where('m.churchId = :churchId', { churchId });
    this.applySearchFilters(qb, query.q, affiliationMemberIds);

    if (query.statusId) {
      qb.andWhere('m.statusId = :statusId', { statusId: query.statusId });
    }

    qb.orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    const statusMap = await this.statusMap(churchId);
    const view = items.map(member => ({ ...member, statusName: statusMap.get(member.statusId)?.name ?? null }));
    const counts = await this.countByStatus(churchId, query.q, affiliationMemberIds, statusMap);

    return { items: view, total, page, pageSize, counts };
  }

  /** 소속(부서/사역팀/목장) 필터가 있으면 해당 활성 소속 성도 id 목록, 없으면 null. */
  private async resolveAffiliationMemberIds(churchId: number, query: ListMemberQueryDto): Promise<number[] | null> {
    if (!query.affiliationKind || !query.affiliationId) return null;
    return this.affiliations.memberIdsFor(query.affiliationKind, churchId, query.affiliationId);
  }

  /** 이름·전화 부분일치 + 소속 성도 id 필터를 쿼리에 적용 (list/countByStatus 공용). */
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
    const [affiliations, position, statusMap] = await Promise.all([
      this.affiliations.listForMember(churchId, id),
      this.positions.history(churchId, id),
      this.statusMap(churchId),
    ]);
    return { ...member, statusName: statusMap.get(member.statusId)?.name ?? null, affiliations, position };
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

  /** 교회 재적상태 map (id → 상태). */
  private async statusMap(churchId: number): Promise<Map<number, MemberStatusEntity>> {
    const statuses = await this.statusRepo().find({ where: { churchId } });
    return new Map(statuses.map(status => [status.id, status]));
  }

  /** 신규 성도 기본 상태 = 활성 상태 중 sortOrder 최소(보통 '방문'). */
  private async defaultStatusId(churchId: number): Promise<number> {
    const status = await this.statusRepo().findOne({
      where: { churchId, isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    if (!status) throw new NotFoundException('재적상태가 설정되지 않았습니다.');
    return status.id;
  }

  /** UI filter chip 카운트 — 활성 상태별(0 포함) + 전체. */
  private async countByStatus(
    churchId: number,
    q: string | undefined,
    affiliationMemberIds: number[] | null | undefined,
    statusMap: Map<number, MemberStatusEntity>
  ): Promise<MemberListCounts> {
    const qb = this.repo()
      .createQueryBuilder('m')
      .select('m.statusId', 'statusId')
      .addSelect('COUNT(*)', 'cnt')
      .where('m.churchId = :churchId', { churchId });

    this.applySearchFilters(qb, q, affiliationMemberIds);
    qb.groupBy('m.statusId');

    const rows = (await qb.getRawMany()) as { statusId: number; cnt: string }[];
    const countById = new Map(rows.map(row => [Number(row.statusId), Number(row.cnt)]));
    const all = rows.reduce((sum, row) => sum + Number(row.cnt), 0);

    const byStatus = Array.from(statusMap.values())
      .filter(status => status.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .map(status => ({ id: status.id, name: status.name, count: countById.get(status.id) ?? 0 }));

    return { all, byStatus };
  }
}
