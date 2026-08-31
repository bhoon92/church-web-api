import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSources } from '@src/database/data-sources';
import { AccountEntity } from '@src/database/entities/account.entity';
import { CareNoteEntity, CareNoteType } from '@src/database/entities/care-note.entity';
import { MemberEntity } from '@src/database/entities/member.entity';
import { todayString } from '@src/common/date';
import { CreateCareNoteDto } from './dto/create-care-note.dto';
import { UpdateCareNoteDto } from './dto/update-care-note.dto';

export type CareNoteItem = {
  id: number;
  type: CareNoteType;
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
export class CareNoteService {
  private repo() {
    return DataSources.instance.getRepository(CareNoteEntity);
  }

  async create(churchId: number, memberId: number, recorderAccountId: number, dto: CreateCareNoteDto): Promise<CareNoteEntity> {
    await this.assertMember(churchId, memberId);
    const row = this.repo().create({
      churchId,
      memberId,
      recorderAccountId,
      type: dto.type ?? CareNoteType.MEETING,
      date: dto.date ?? this.today(),
      location: dto.location,
      content: dto.content,
      prayerRequest: dto.prayerRequest,
      statusNote: dto.statusNote,
    });
    return this.repo().save(row);
  }

  /** 한 교인의 양육 기록 timeline (기록일 내림차순). 작성자 이름까지 join. */
  async listForMember(churchId: number, memberId: number): Promise<CareNoteItem[]> {
    await this.assertMember(churchId, memberId);
    const rows = await this.repo().find({
      where: { churchId, memberId },
      order: { date: 'DESC', id: 'DESC' },
    });
    if (rows.length === 0) return [];

    const accountIds = Array.from(new Set(rows.map(note => note.recorderAccountId)));
    const accounts = await DataSources.instance.getRepository(AccountEntity).find({ where: accountIds.map(id => ({ id })) });
    const nameMap = new Map(accounts.map(account => [account.id, account.name]));

    return rows.map(note => ({
      id: note.id,
      type: note.type,
      date: note.date,
      location: note.location ?? null,
      content: note.content,
      prayerRequest: note.prayerRequest ?? null,
      statusNote: note.statusNote ?? null,
      recorderAccountId: note.recorderAccountId,
      recorderName: nameMap.get(note.recorderAccountId) ?? null,
      createdAt: note.createdAt,
    }));
  }

  async update(churchId: number, memberId: number, id: number, dto: UpdateCareNoteDto): Promise<CareNoteEntity> {
    const row = await this.repo().findOne({ where: { id, churchId, memberId } });
    if (!row) throw new NotFoundException('양육 기록을 찾을 수 없습니다.');
    await this.repo().update({ id, churchId, memberId }, dto);
    const updated = await this.repo().findOne({ where: { id, churchId, memberId } });
    return updated!;
  }

  async remove(churchId: number, memberId: number, id: number): Promise<void> {
    const result = await this.repo().softDelete({ id, churchId, memberId });
    if (!result.affected) throw new NotFoundException('양육 기록을 찾을 수 없습니다.');
  }

  private async assertMember(churchId: number, memberId: number): Promise<void> {
    const member = await DataSources.instance.getRepository(MemberEntity).findOne({ where: { id: memberId, churchId } });
    if (!member) throw new NotFoundException('Member not found');
  }

  private today(): string {
    // toISOString 은 UTC 라 TZ=Asia/Seoul 에서 새벽 0~9시에 어제 날짜가 된다.
    return todayString();
  }
}
