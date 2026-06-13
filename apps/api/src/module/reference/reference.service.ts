import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';
import { DataSources } from '@src/database/data-sources';
import { UpsertReferenceDto } from './dto/upsert-reference.dto';

type RefRow = ObjectLiteral & {
  id: number;
  churchId: number;
  year?: number;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
};

type EntityClass<T> = { new (): T };

@Injectable()
export class ReferenceService {
  private repo<T extends RefRow>(entity: EntityClass<T>): Repository<T> {
    return DataSources.instance.getRepository(entity);
  }

  // year 를 넘기면 연도별 reference(부서·사역팀·목장), 안 넘기면 연도 무관 reference(직분·예배 등).
  list<T extends RefRow>(entity: EntityClass<T>, churchId: number, year?: number): Promise<T[]> {
    return this.repo(entity).find({
      where: (year != null ? { churchId, year } : { churchId }) as never,
      order: { sortOrder: 'ASC', id: 'ASC' } as never,
    });
  }

  async create<T extends RefRow>(entity: EntityClass<T>, churchId: number, dto: UpsertReferenceDto, year?: number): Promise<T> {
    const repo = this.repo(entity);
    const row = new entity();
    Object.assign(row, {
      churchId,
      name: dto.name,
      description: dto.description,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      ...(year != null ? { year } : {}),
    });
    return repo.save(row);
  }

  async update<T extends RefRow>(entity: EntityClass<T>, churchId: number, id: number, dto: Partial<UpsertReferenceDto>): Promise<T> {
    const repo = this.repo(entity);
    const existing = await repo.findOne({ where: { id, churchId } as never });
    if (!existing) throw new NotFoundException('Reference not found');
    await repo.update({ id, churchId } as never, dto as never);
    return (await repo.findOne({ where: { id, churchId } as never }))!;
  }

  async remove<T extends RefRow>(entity: EntityClass<T>, churchId: number, id: number): Promise<void> {
    const result = await this.repo(entity).softDelete({ id, churchId } as never);
    if (!result.affected) throw new NotFoundException('Reference not found');
  }

  // 이전 연도(fromYear) 구성을 새 연도(toYear)로 복제. 대상 연도가 비어있을 때만 허용.
  async copyYear<T extends RefRow>(entity: EntityClass<T>, churchId: number, fromYear: number, toYear: number): Promise<T[]> {
    const repo = this.repo(entity);
    const alreadyHas = await repo.count({ where: { churchId, year: toYear } as never });
    if (alreadyHas > 0) throw new ConflictException('대상 연도에 이미 등록된 항목이 있습니다');
    const source = await repo.find({
      where: { churchId, year: fromYear } as never,
      order: { sortOrder: 'ASC', id: 'ASC' } as never,
    });
    const clones = source.map(item =>
      Object.assign(new entity(), {
        churchId,
        year: toYear,
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      })
    );
    return repo.save(clones);
  }
}
