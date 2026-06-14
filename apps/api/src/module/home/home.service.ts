import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DataSources } from '@src/database/data-sources';
import { AttendanceEntity } from '@src/database/entities/attendance.entity';
import { CalendarEntity } from '@src/database/entities/calendar.entity';
import { FinanceTransactionEntity, TransactionFlow } from '@src/database/entities/finance-transaction.entity';
import { MemberEntity } from '@src/database/entities/member.entity';
import { MemberStatusEntity } from '@src/database/entities/member-status.entity';
import { OfferingCategoryEntity } from '@src/database/entities/offering-category.entity';
import { OfferingEntity } from '@src/database/entities/offering.entity';
import { CalendarEventService } from '@src/module/calendar/calendar-event.service';
import { BudgetService } from '@src/module/finance/budget.service';
import { FiscalYearService } from '@src/module/finance/fiscal-year.service';
import { OfferingService } from '@src/module/finance/offering.service';

export type HomeScheduleItem = {
  id: number;
  title: string;
  startAt: string;
  allDay: boolean;
  layer: string;
  color: string;
};

export type HomeActivityItem = {
  kind: 'offering' | 'member' | 'transaction';
  who: string;
  what: string;
  at: string;
};

export type HomeDashboard = {
  stats: {
    weeklyAttendance: number;
    monthlyOffering: number;
    newMembers: number;
    budgetRate: number | null;
  };
  schedule: HomeScheduleItem[];
  activity: HomeActivityItem[];
};

@Injectable()
export class HomeService {
  constructor(
    private readonly offerings: OfferingService,
    private readonly budgets: BudgetService,
    private readonly fiscalYears: FiscalYearService,
    private readonly calendarEvents: CalendarEventService
  ) {}

  async summary(churchId: number): Promise<HomeDashboard> {
    const now = new Date();
    const week = this.weekRange(now);
    const month = this.monthRange(now);
    const day = this.dayRange(now);

    const [weeklyAttendance, monthlyOffering, newMembers, budgetRate, schedule, activity] = await Promise.all([
      this.weeklyAttendance(churchId, week.start, week.end),
      this.offerings.sumBetween(churchId, month.start, month.end),
      this.newMembers(churchId, month.start, month.end),
      this.budgetRate(churchId),
      this.todaySchedule(churchId, day.start, day.end),
      this.recentActivity(churchId),
    ]);

    return { stats: { weeklyAttendance, monthlyOffering, newMembers, budgetRate }, schedule, activity };
  }

  /** 이번 주(일~토) 출석한 고유 성도 수. */
  private async weeklyAttendance(churchId: number, start: string, end: string): Promise<number> {
    const raw = (await DataSources.instance
      .getRepository(AttendanceEntity)
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.member_id)', 'count')
      .where('a.church_id = :churchId', { churchId })
      .andWhere('a.date BETWEEN :start AND :end', { start, end })
      .getRawOne()) as { count: string };
    return Number(raw.count);
  }

  /** 이번 달 정식 등록(registeredAt)된 새가족 수. */
  private async newMembers(churchId: number, start: string, end: string): Promise<number> {
    return DataSources.instance
      .getRepository(MemberEntity)
      .createQueryBuilder('m')
      .where('m.church_id = :churchId', { churchId })
      .andWhere('m.registered_at BETWEEN :start AND :end', { start, end })
      .getCount();
  }

  private async budgetRate(churchId: number): Promise<number | null> {
    const fy = await this.fiscalYears.current(churchId);
    if (!fy) return null;
    const budget = await this.budgets.executionRate(churchId, fy.id);
    return budget?.rate ?? null;
  }

  /** 오늘 시작하는 일정 (반복 occurrence 포함, 시작 시각 오름차순). */
  private async todaySchedule(churchId: number, start: Date, end: Date): Promise<HomeScheduleItem[]> {
    // CalendarEventService.list 가 반복 일정을 occurrence 로 펼쳐줌 → 달력 화면과 일관.
    const events = (await this.calendarEvents.list(churchId, start.toISOString(), end.toISOString())).slice(0, 8);
    if (events.length === 0) return [];

    const calendarIds = Array.from(new Set(events.map(event => event.calendarId)));
    const calendars = await DataSources.instance.getRepository(CalendarEntity).find({ where: { id: In(calendarIds), churchId } });
    const calendarMap = new Map(calendars.map(calendar => [calendar.id, calendar]));

    return events.map(event => {
      const calendar = calendarMap.get(event.calendarId);
      return {
        id: event.id,
        title: event.title,
        startAt: event.startAt,
        allDay: event.allDay,
        layer: calendar?.name ?? '일정',
        color: calendar?.color ?? 'oklch(0.6 0.14 250)',
      };
    });
  }

  /** 최근 활동 — 헌금/신규성도/운영거래 최신 항목을 시간순 병합. */
  private async recentActivity(churchId: number): Promise<HomeActivityItem[]> {
    const [offerings, members, transactions] = await Promise.all([
      DataSources.instance.getRepository(OfferingEntity).find({ where: { churchId }, order: { createdAt: 'DESC' }, take: 6 }),
      DataSources.instance.getRepository(MemberEntity).find({ where: { churchId }, order: { createdAt: 'DESC' }, take: 6 }),
      DataSources.instance.getRepository(FinanceTransactionEntity).find({ where: { churchId }, order: { createdAt: 'DESC' }, take: 6 }),
    ]);

    const newStatus = await DataSources.instance.getRepository(MemberStatusEntity).findOne({ where: { churchId, systemKey: 'new' } });
    const newStatusId = newStatus?.id ?? null;

    const memberIds = Array.from(new Set(offerings.map(offering => offering.memberId)));
    const categoryIds = Array.from(new Set(offerings.map(offering => offering.offeringCategoryId)));
    const [offeringMembers, categories] = await Promise.all([
      memberIds.length
        ? DataSources.instance.getRepository(MemberEntity).find({ where: memberIds.map(id => ({ id, churchId })) })
        : Promise.resolve([]),
      categoryIds.length
        ? DataSources.instance.getRepository(OfferingCategoryEntity).find({ where: categoryIds.map(id => ({ id, churchId })) })
        : Promise.resolve([]),
    ]);
    const memberNameMap = new Map(offeringMembers.map(member => [member.id, member.name]));
    const categoryNameMap = new Map(categories.map(category => [category.id, category.name]));

    const items: HomeActivityItem[] = [
      ...offerings.map(offering => ({
        kind: 'offering' as const,
        who: memberNameMap.get(offering.memberId) ?? offering.rawDonorName ?? '익명',
        what: `${categoryNameMap.get(offering.offeringCategoryId) ?? '헌금'} ${this.krw(offering.amount)}`,
        at: offering.createdAt.toISOString(),
      })),
      ...members.map(member => ({
        kind: 'member' as const,
        who: member.name,
        what: newStatusId !== null && member.statusId === newStatusId ? '새가족 등록' : '성도 등록',
        at: member.createdAt.toISOString(),
      })),
      ...transactions.map(transaction => ({
        kind: 'transaction' as const,
        who: '회계',
        what: `${transaction.title} ${transaction.flow === TransactionFlow.EXPENSE ? '지출' : '수입'} ${this.krw(transaction.amount)}`,
        at: transaction.createdAt.toISOString(),
      })),
    ];

    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  }

  private krw(amount: number): string {
    return `₩${amount.toLocaleString()}`;
  }

  private ymd(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  /** 일(0)~토(6) 기준 이번 주 범위 (로컬). */
  private weekRange(now: Date): { start: string; end: string } {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: this.ymd(start), end: this.ymd(end) };
  }

  private monthRange(now: Date): { start: string; end: string } {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: this.ymd(start), end: this.ymd(end) };
  }

  private dayRange(now: Date): { start: Date; end: Date } {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end };
  }
}
