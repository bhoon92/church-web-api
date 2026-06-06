import { Injectable, NotFoundException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';
import { DataSources } from '@src/database/data-sources';
import { UpsertReferenceDto } from './dto/upsert-reference.dto';

type RefRow = ObjectLiteral & {
  id: number;
  churchId: number;
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

  list<T extends RefRow>(entity: EntityClass<T>, churchId: number): Promise<T[]> {
    return this.repo(entity).find({
      where: { churchId } as never,
      order: { sortOrder: 'ASC', id: 'ASC' } as never,
    });
  }

  async create<T extends RefRow>(entity: EntityClass<T>, churchId: number, dto: UpsertReferenceDto): Promise<T> {
    const repo = this.repo(entity);
    const row = new entity();
    Object.assign(row, {
      churchId,
      name: dto.name,
      description: dto.description,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
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
}
