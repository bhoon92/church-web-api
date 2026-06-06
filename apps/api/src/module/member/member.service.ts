import { Injectable, NotFoundException } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { DataSources } from '@src/database/data-sources';
import { LifecycleStage, MemberEntity } from '@src/database/entities/member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { ListMemberQueryDto } from './dto/list-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

export type StageCount = Record<LifecycleStage | 'all', number>;

@Injectable()
export class MemberService {
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

    const qb = this.repo().createQueryBuilder('m').where('m.churchId = :churchId', { churchId });

    if (query.q) {
      qb.andWhere(
        new Brackets(b => {
          b.where('m.name ILIKE :q', { q: `%${query.q}%` })
            .orWhere('m.phone ILIKE :q', { q: `%${query.q}%` })
            .orWhere('m.previousChurch ILIKE :q', { q: `%${query.q}%` });
        })
      );
    }

    if (query.stage && query.stage.length > 0) {
      qb.andWhere('m.lifecycleStage IN (:...stages)', { stages: query.stage });
    }

    qb.orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    const counts = await this.countByStage(churchId, query.q);

    return { items, total, page, pageSize, counts };
  }

  async findById(churchId: number, id: number): Promise<MemberEntity> {
    const member = await this.repo().findOne({ where: { id, churchId } });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async update(churchId: number, id: number, dto: UpdateMemberDto): Promise<MemberEntity> {
    await this.findById(churchId, id);
    await this.repo().update({ id, churchId }, dto);
    return this.findById(churchId, id);
  }

  async remove(churchId: number, id: number): Promise<void> {
    const result = await this.repo().softDelete({ id, churchId });
    if (!result.affected) throw new NotFoundException('Member not found');
  }

  /** UI filter chip 카운트 */
  private async countByStage(churchId: number, q?: string): Promise<StageCount> {
    const qb = this.repo()
      .createQueryBuilder('m')
      .select('m.lifecycleStage', 'stage')
      .addSelect('COUNT(*)', 'cnt')
      .where('m.churchId = :churchId', { churchId });

    if (q) {
      qb.andWhere(
        new Brackets(b => {
          b.where('m.name ILIKE :q', { q: `%${q}%` })
            .orWhere('m.phone ILIKE :q', { q: `%${q}%` })
            .orWhere('m.previousChurch ILIKE :q', { q: `%${q}%` });
        })
      );
    }

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
