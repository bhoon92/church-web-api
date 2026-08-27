import { Injectable, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import { DataSources } from '@src/database/data-sources';
import { MemberEntity } from '@src/database/entities/member.entity';
import { CohortStatus, TrainingCohortEntity } from '@src/database/entities/training-cohort.entity';
import { TrainingCourseEntity } from '@src/database/entities/training-course.entity';
import { EnrollmentStatus, TrainingEnrollmentEntity } from '@src/database/entities/training-enrollment.entity';
import { TrainingSessionEntity } from '@src/database/entities/training-session.entity';
import { TrainingAttendanceEntity } from '@src/database/entities/training-attendance.entity';
import { CreateCohortDto, ListCohortQueryDto, UpdateCohortDto, UpdateSessionDto } from './dto/cohort.dto';

/** 목록용 기수 요약 — 진행률까지 계산해서 내려준다. */
export type CohortSummary = {
  id: number;
  courseId: number;
  courseName: string;
  ordinal: number;
  label: string;
  startDate: string;
  endDate: string | null;
  status: CohortStatus;
  leaderMemberId: number | null;
  leaderName: string | null;
  sessionCount: number;
  enrolledCount: number;
  completedCount: number;
};

@Injectable()
export class TrainingCohortService {
  private repo() {
    return DataSources.instance.getRepository(TrainingCohortEntity);
  }

  private sessionRepo() {
    return DataSources.instance.getRepository(TrainingSessionEntity);
  }

  private enrollmentRepo() {
    return DataSources.instance.getRepository(TrainingEnrollmentEntity);
  }

  async list(churchId: number, query: ListCohortQueryDto): Promise<CohortSummary[]> {
    const where = {
      churchId,
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const cohorts = await this.repo().find({ where, order: { startDate: 'DESC', id: 'DESC' } });
    if (cohorts.length === 0) return [];

    const [courseMap, leaderMap, sessionCounts, enrollmentRows] = await Promise.all([
      this.courseNameMap(churchId),
      this.leaderNameMap(churchId, cohorts),
      this.sessionCountMap(cohorts.map(cohort => cohort.id)),
      this.enrollmentRepo().find({ where: { churchId, cohortId: In(cohorts.map(cohort => cohort.id)) } }),
    ]);

    return cohorts.map(cohort => {
      const enrollments = enrollmentRows.filter(row => row.cohortId === cohort.id);
      const courseName = courseMap.get(cohort.courseId) ?? '(삭제된 과정)';
      return {
        id: cohort.id,
        courseId: cohort.courseId,
        courseName,
        ordinal: cohort.ordinal,
        label: `${courseName} ${cohort.ordinal}기`,
        startDate: cohort.startDate,
        endDate: cohort.endDate ?? null,
        status: cohort.status,
        leaderMemberId: cohort.leaderMemberId ?? null,
        leaderName: cohort.leaderMemberId ? (leaderMap.get(cohort.leaderMemberId) ?? null) : null,
        sessionCount: sessionCounts.get(cohort.id) ?? 0,
        enrolledCount: enrollments.length,
        completedCount: enrollments.filter(row => row.status === EnrollmentStatus.COMPLETED).length,
      };
    });
  }

  async findById(churchId: number, id: number): Promise<TrainingCohortEntity> {
    const cohort = await this.repo().findOne({ where: { id, churchId } });
    if (!cohort) throw new NotFoundException('기수를 찾을 수 없습니다.');
    return cohort;
  }

  /** 기수 개설 — 회차를 함께 만든다 (한 트랜잭션). 회차 없이 만든 기수는 출석 체크를 할 수 없어서. */
  async create(churchId: number, dto: CreateCohortDto): Promise<TrainingCohortEntity> {
    const course = await DataSources.instance.getRepository(TrainingCourseEntity).findOne({ where: { id: dto.courseId, churchId } });
    if (!course) throw new NotFoundException('훈련 과정을 찾을 수 없습니다.');

    const ordinal = dto.ordinal ?? (await this.nextOrdinal(churchId, dto.courseId));
    const sessionCount = dto.sessionCount ?? course.defaultSessionCount;

    return DataSources.instance.transaction(async manager => {
      const cohort = await manager.getRepository(TrainingCohortEntity).save(
        manager.getRepository(TrainingCohortEntity).create({
          churchId,
          courseId: dto.courseId,
          ordinal,
          startDate: dto.startDate,
          endDate: dto.endDate,
          status: CohortStatus.PLANNED,
          leaderMemberId: dto.leaderMemberId,
          note: dto.note,
        })
      );

      const sessions = Array.from({ length: sessionCount }, (_unused, index) =>
        manager.getRepository(TrainingSessionEntity).create({
          churchId,
          cohortId: cohort.id,
          sequence: index + 1,
        })
      );
      if (sessions.length > 0) await manager.getRepository(TrainingSessionEntity).save(sessions);

      return cohort;
    });
  }

  /** sessionCount 는 개설 시에만 의미가 있어 수정에서는 무시한다 (회차 증감은 addSession 사용). */
  async update(churchId: number, id: number, dto: UpdateCohortDto): Promise<TrainingCohortEntity> {
    await this.findById(churchId, id);
    const editable = ['courseId', 'ordinal', 'startDate', 'endDate', 'status', 'leaderMemberId', 'note'] as const;
    const patch: Partial<TrainingCohortEntity> = {};
    for (const key of editable) {
      if (dto[key] !== undefined) Object.assign(patch, { [key]: dto[key] });
    }
    await this.repo().update({ id, churchId }, patch);
    return this.findById(churchId, id);
  }

  /** 기수 삭제 — 회차·수강·출석까지 함께 정리한다. */
  async remove(churchId: number, id: number): Promise<void> {
    await this.findById(churchId, id);
    await DataSources.instance.transaction(async manager => {
      const sessions = await manager.getRepository(TrainingSessionEntity).find({ where: { churchId, cohortId: id } });
      const enrollments = await manager.getRepository(TrainingEnrollmentEntity).find({ where: { churchId, cohortId: id } });
      if (sessions.length > 0) {
        await manager.getRepository(TrainingAttendanceEntity).softDelete({ sessionId: In(sessions.map(s => s.id)) });
        await manager.getRepository(TrainingSessionEntity).softDelete({ id: In(sessions.map(s => s.id)) });
      }
      if (enrollments.length > 0) {
        await manager.getRepository(TrainingEnrollmentEntity).softDelete({ id: In(enrollments.map(e => e.id)) });
      }
      await manager.getRepository(TrainingCohortEntity).softDelete({ id, churchId });
    });
  }

  async listSessions(churchId: number, cohortId: number): Promise<TrainingSessionEntity[]> {
    await this.findById(churchId, cohortId);
    return this.sessionRepo().find({ where: { churchId, cohortId }, order: { sequence: 'ASC' } });
  }

  async updateSession(churchId: number, sessionId: number, dto: UpdateSessionDto): Promise<TrainingSessionEntity> {
    const session = await this.sessionRepo().findOne({ where: { id: sessionId, churchId } });
    if (!session) throw new NotFoundException('회차를 찾을 수 없습니다.');
    await this.sessionRepo().update({ id: sessionId, churchId }, dto);
    return (await this.sessionRepo().findOne({ where: { id: sessionId, churchId } }))!;
  }

  /** 회차 추가 — 과정보다 길게 진행될 때. */
  async addSession(churchId: number, cohortId: number): Promise<TrainingSessionEntity> {
    await this.findById(churchId, cohortId);
    const last = await this.sessionRepo().findOne({ where: { churchId, cohortId }, order: { sequence: 'DESC' } });
    return this.sessionRepo().save(this.sessionRepo().create({ churchId, cohortId, sequence: (last?.sequence ?? 0) + 1 }));
  }

  private async nextOrdinal(churchId: number, courseId: number): Promise<number> {
    const last = await this.repo().findOne({ where: { churchId, courseId }, order: { ordinal: 'DESC' } });
    return (last?.ordinal ?? 0) + 1;
  }

  private async courseNameMap(churchId: number): Promise<Map<number, string>> {
    const courses = await DataSources.instance.getRepository(TrainingCourseEntity).find({ where: { churchId } });
    return new Map(courses.map(course => [course.id, course.name]));
  }

  private async leaderNameMap(churchId: number, cohorts: TrainingCohortEntity[]): Promise<Map<number, string>> {
    const ids = Array.from(new Set(cohorts.map(cohort => cohort.leaderMemberId).filter((id): id is number => Boolean(id))));
    if (ids.length === 0) return new Map();
    const members = await DataSources.instance.getRepository(MemberEntity).find({ where: { churchId, id: In(ids) } });
    return new Map(members.map(member => [member.id, member.name]));
  }

  private async sessionCountMap(cohortIds: number[]): Promise<Map<number, number>> {
    if (cohortIds.length === 0) return new Map();
    const rows = (await this.sessionRepo()
      .createQueryBuilder('s')
      .select('s.cohort_id', 'cohortId')
      .addSelect('COUNT(*)', 'count')
      .where('s.cohort_id IN (:...cohortIds)', { cohortIds })
      .andWhere('s.deleted_at IS NULL')
      .groupBy('s.cohort_id')
      .getRawMany()) as { cohortId: number; count: string }[];
    return new Map(rows.map(row => [Number(row.cohortId), Number(row.count)]));
  }
}
