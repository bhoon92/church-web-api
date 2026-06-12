import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Between } from 'typeorm';
import { DataSources } from '@src/database/data-sources';
import { CalendarEntity } from '@src/database/entities/calendar.entity';
import { CalendarEventEntity } from '@src/database/entities/calendar-event.entity';
import { GoogleCalendarSyncService } from '@src/module/google-calendar/sync.service';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/calendar-event.dto';

@Injectable()
export class CalendarEventService {
  constructor(private readonly sync: GoogleCalendarSyncService) {}

  private repo() {
    return DataSources.instance.getRepository(CalendarEventEntity);
  }

  /** 기간 내 일정 (startAt 기준). */
  list(churchId: number, from: string, to: string): Promise<CalendarEventEntity[]> {
    return this.repo().find({
      where: { churchId, startAt: Between(new Date(from), new Date(to)) },
      order: { startAt: 'ASC', id: 'ASC' },
    });
  }

  async create(churchId: number, dto: CreateCalendarEventDto): Promise<CalendarEventEntity> {
    await this.assertCalendar(churchId, dto.calendarId);
    const row = this.repo().create({
      churchId,
      calendarId: dto.calendarId,
      title: dto.title,
      location: dto.location,
      description: dto.description,
      allDay: dto.allDay ?? false,
      startAt: new Date(dto.startAt),
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
    });
    const saved = await this.repo().save(row);
    void this.sync.onEventCreated(saved); // best-effort, 비차단
    return saved;
  }

  async update(churchId: number, id: number, dto: UpdateCalendarEventDto): Promise<CalendarEventEntity> {
    const found = await this.repo().findOne({ where: { id, churchId } });
    if (!found) throw new NotFoundException('일정을 찾을 수 없습니다.');
    if (dto.calendarId) await this.assertCalendar(churchId, dto.calendarId);
    await this.repo().update(
      { id, churchId },
      {
        ...dto,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
      }
    );
    const updated = (await this.repo().findOne({ where: { id, churchId } }))!;
    void this.sync.onEventUpdated(updated); // best-effort, 비차단
    return updated;
  }

  async remove(churchId: number, id: number): Promise<void> {
    const result = await this.repo().softDelete({ id, churchId });
    if (!result.affected) throw new NotFoundException('일정을 찾을 수 없습니다.');
    void this.sync.onEventDeleted(churchId, id); // best-effort, 비차단
  }

  private async assertCalendar(churchId: number, calendarId: number): Promise<void> {
    const c = await DataSources.instance.getRepository(CalendarEntity).findOne({ where: { id: calendarId, churchId } });
    if (!c) throw new BadRequestException('달력을 찾을 수 없습니다.');
  }
}
