import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSources } from '@src/database/data-sources';
import { AccountEntity } from '@src/database/entities/account.entity';
import { MemberEntity } from '@src/database/entities/member.entity';
import { PastoralRecordEntity, PastoralRecordType } from '@src/database/entities/pastoral-record.entity';
import { CreatePastoralRecordDto } from './dto/create-pastoral-record.dto';
import { UpdatePastoralRecordDto } from './dto/update-pastoral-record.dto';

export type PastoralRecordItem = {
  id: number;
  type: PastoralRecordType;
  date: string;
  location: string | null;
  content: string;
  prayerRequest: string | null;
  statusNote: string | null;
  recorderAccountId: number;
  recorderName: string | null;
  createdAt: Date;
};

@Injectable()
export class PastoralRecordService {
  private repo() {
    return DataSources.instance.getRepository(PastoralRecordEntity);
  }

  async create(churchId: number, memberId: number, recorderAccountId: number, dto: CreatePastoralRecordDto): Promise<PastoralRecordEntity> {
    await this.assertMember(churchId, memberId);
    const row = this.repo().create({
      churchId,
      memberId,
      recorderAccountId,
      type: dto.type ?? PastoralRecordType.VISIT,
      date: dto.date ?? this.today(),
      location: dto.location,
      content: dto.content,
      prayerRequest: dto.prayerRequest,
      statusNote: dto.statusNote,
    });
    return this.repo().save(row);
  }

  /** 한 성도의 사역 기록 timeline (기록일 내림차순). 작성자 이름까지 join. */
  async listForMember(churchId: number, memberId: number): Promise<PastoralRecordItem[]> {
    await this.assertMember(churchId, memberId);
    const rows = await this.repo().find({
      where: { churchId, memberId },
      order: { date: 'DESC', id: 'DESC' },
    });
    if (rows.length === 0) return [];

    const accountIds = Array.from(new Set(rows.map(record => record.recorderAccountId)));
    const accounts = await DataSources.instance.getRepository(AccountEntity).find({ where: accountIds.map(id => ({ id })) });
    const nameMap = new Map(accounts.map(account => [account.id, account.name]));

    return rows.map(record => ({
      id: record.id,
      type: record.type,
      date: record.date,
      location: record.location ?? null,
      content: record.content,
      prayerRequest: record.prayerRequest ?? null,
      statusNote: record.statusNote ?? null,
      recorderAccountId: record.recorderAccountId,
      recorderName: nameMap.get(record.recorderAccountId) ?? null,
      createdAt: record.createdAt,
    }));
  }

  async update(churchId: number, memberId: number, id: number, dto: UpdatePastoralRecordDto): Promise<PastoralRecordEntity> {
    const row = await this.repo().findOne({ where: { id, churchId, memberId } });
    if (!row) throw new NotFoundException('사역 기록을 찾을 수 없습니다.');
    await this.repo().update({ id, churchId, memberId }, dto);
    const updated = await this.repo().findOne({ where: { id, churchId, memberId } });
    return updated!;
  }

  async remove(churchId: number, memberId: number, id: number): Promise<void> {
    const result = await this.repo().softDelete({ id, churchId, memberId });
    if (!result.affected) throw new NotFoundException('사역 기록을 찾을 수 없습니다.');
  }

  private async assertMember(churchId: number, memberId: number): Promise<void> {
    const member = await DataSources.instance.getRepository(MemberEntity).findOne({ where: { id: memberId, churchId } });
    if (!member) throw new NotFoundException('Member not found');
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
