import { EntityManager } from 'typeorm';
import { AccountCategoryEntity } from '@src/database/entities/account-category.entity';
import { CalendarEntity } from '@src/database/entities/calendar.entity';
import { DepartmentEntity } from '@src/database/entities/department.entity';
import { MemberStatusEntity } from '@src/database/entities/member-status.entity';
import { MinistryEntity } from '@src/database/entities/ministry.entity';
import { MissionaryStageEntity } from '@src/database/entities/missionary-stage.entity';
import { OfferingCategoryEntity } from '@src/database/entities/offering-category.entity';
import { PositionEntity } from '@src/database/entities/position.entity';
import { SmallGroupEntity } from '@src/database/entities/small-group.entity';
import { TrainingCourseEntity, TrainingFormat } from '@src/database/entities/training-course.entity';
import { WorshipServiceEntity } from '@src/database/entities/worship-service.entity';

/**
 * 교회 생성 시 함께 만드는 기준정보 기본값.
 *
 * 이게 없으면 재적상태가 하나도 없어서 **교인 등록이 즉시 실패**한다
 * (member.service 가 기본 상태를 찾지 못해 404). 예전에는 마이그레이션이 기존 교회에 일괄 시드해서
 * 드러나지 않던 문제였다 (planning 00.6).
 *
 * 기본값은 키퍼스처치 기준(양성 파이프라인 중심)이며, 만든 뒤 설정 화면에서 자유롭게 편집할 수 있다.
 */

/** 재적상태 = 양성 파이프라인 단계. systemKey 가 있는 항목은 코드가 참조하므로 삭제 불가. */
const MEMBER_STATUSES: { name: string; sortOrder: number; systemKey?: string; countsInRoster: boolean; isActive?: boolean }[] = [
  { name: '방문', sortOrder: 0, countsInRoster: true },
  { name: '새가족', sortOrder: 1, systemKey: 'new', countsInRoster: true },
  { name: '정착', sortOrder: 2, countsInRoster: true },
  { name: '훈련생', sortOrder: 3, systemKey: 'trainee', countsInRoster: true },
  { name: '사역자', sortOrder: 4, systemKey: 'worker', countsInRoster: true },
  // 파송자는 현지에 있으므로 주일 출석 명단에서 제외한다.
  { name: '파송', sortOrder: 5, systemKey: 'commissioned', countsInRoster: false },
  { name: '장기결석', sortOrder: 6, countsInRoster: true },
  { name: '이명', sortOrder: 7, countsInRoster: false },
  { name: '별세', sortOrder: 8, countsInRoster: false },
  { name: '익명', sortOrder: 9, systemKey: 'anonymous', countsInRoster: false, isActive: false },
];

/** 사역 역할 (구 직분). 청년 공동체라 장로·권사 대신 사역 중심으로 둔다. */
const POSITIONS = ['담임목사', '목사', '전도사', '간사', '팀장', '사역자'];

/** 5개 사역팀 — 이 교회의 핵심 조직 축이자 양성 인큐베이터. */
const MINISTRIES = ['예배사역팀', '미디어·문화예술팀', '다음세대팀', '비즈니스팀', '해외선교팀'];

/** 상설 기관 (연령 부서 아님). */
const DEPARTMENTS = ['본부', '유치원', '카페'];

/** 공동생활 공동체. 실제 하우스 이름으로 바꿔 쓰면 된다. */
const SMALL_GROUPS = ['1하우스', '2하우스'];

const WORSHIP_SERVICES = ['주일예배', '수요예배', '금요기도회', '새벽기도회'];

const OFFERING_CATEGORIES = ['십일조', '주정헌금', '감사헌금', '선교헌금', '건축헌금', '특별헌금'];

const ACCOUNT_CATEGORIES = ['인건비', '사역비', '운영비', '선교비', '시설비', '기타'];

/**
 * 선교사 단계 기본값. 파송 절차는 교회마다 달라 이름·개수를 자유롭게 바꿀 수 있고,
 * 코드가 아는 건 `countsAsActive`(현재 파송 중으로 집계할 단계인지) 하나뿐이다.
 */
const MISSIONARY_STAGES: { name: string; countsAsActive: boolean }[] = [
  { name: '후보', countsAsActive: false },
  { name: '훈련 중', countsAsActive: false },
  { name: '파송 확정', countsAsActive: true },
  { name: '현지 사역', countsAsActive: true },
  { name: '안식년', countsAsActive: true },
  { name: '복귀', countsAsActive: false },
  { name: '종료', countsAsActive: false },
];

/** 훈련 과정 — 기사에 나온 3종을 기본값으로. 회차 수는 기수 개설 시 기본값으로 쓰인다. */
const TRAINING_COURSES: { name: string; format: TrainingFormat; defaultSessionCount: number; description: string }[] = [
  {
    name: '믿음으로 길을 걷다',
    format: TrainingFormat.RETREAT,
    defaultSessionCount: 4,
    description: '3박 4일 집중 수련회.',
  },
  {
    name: '살아있는 믿음학교',
    format: TrainingFormat.WEEKLY,
    defaultSessionCount: 12,
    description: '12주간 매주 토요일 진행.',
  },
  {
    name: '고생질 프로젝트',
    format: TrainingFormat.INTENSIVE,
    defaultSessionCount: 1,
    description: '합숙형 말씀 질의응답 훈련.',
  },
];

const CALENDARS: { name: string; color: string; sortOrder: number }[] = [
  { name: '전체 일정', color: 'oklch(0.62 0.19 260)', sortOrder: 0 },
  { name: '훈련', color: 'oklch(0.65 0.15 150)', sortOrder: 1 },
  { name: '선교', color: 'oklch(0.7 0.13 60)', sortOrder: 2 },
];

/** 연도별 기준정보(기관·사역팀·공동체)는 생성 시점의 연도로 시드한다. */
export async function seedChurchReferences(manager: EntityManager, churchId: number, year: number): Promise<void> {
  const statusRepo = manager.getRepository(MemberStatusEntity);
  await statusRepo.save(
    MEMBER_STATUSES.map(status =>
      statusRepo.create({
        churchId,
        name: status.name,
        sortOrder: status.sortOrder,
        systemKey: status.systemKey,
        countsInRoster: status.countsInRoster,
        isActive: status.isActive ?? true,
      })
    )
  );

  const positionRepo = manager.getRepository(PositionEntity);
  await positionRepo.save(POSITIONS.map((name, index) => positionRepo.create({ churchId, name, sortOrder: index })));

  const ministryRepo = manager.getRepository(MinistryEntity);
  await ministryRepo.save(MINISTRIES.map((name, index) => ministryRepo.create({ churchId, year, name, sortOrder: index })));

  const departmentRepo = manager.getRepository(DepartmentEntity);
  await departmentRepo.save(DEPARTMENTS.map((name, index) => departmentRepo.create({ churchId, year, name, sortOrder: index })));

  const smallGroupRepo = manager.getRepository(SmallGroupEntity);
  await smallGroupRepo.save(SMALL_GROUPS.map((name, index) => smallGroupRepo.create({ churchId, year, name, sortOrder: index })));

  const worshipRepo = manager.getRepository(WorshipServiceEntity);
  await worshipRepo.save(WORSHIP_SERVICES.map((name, index) => worshipRepo.create({ churchId, name, sortOrder: index })));

  const offeringRepo = manager.getRepository(OfferingCategoryEntity);
  await offeringRepo.save(OFFERING_CATEGORIES.map((name, index) => offeringRepo.create({ churchId, name, sortOrder: index })));

  const accountRepo = manager.getRepository(AccountCategoryEntity);
  await accountRepo.save(ACCOUNT_CATEGORIES.map((name, index) => accountRepo.create({ churchId, name, sortOrder: index })));

  const courseRepo = manager.getRepository(TrainingCourseEntity);
  await courseRepo.save(TRAINING_COURSES.map((course, index) => courseRepo.create({ churchId, ...course, sortOrder: index })));

  const stageRepo = manager.getRepository(MissionaryStageEntity);
  await stageRepo.save(MISSIONARY_STAGES.map((stage, index) => stageRepo.create({ churchId, ...stage, sortOrder: index })));

  const calendarRepo = manager.getRepository(CalendarEntity);
  await calendarRepo.save(CALENDARS.map(calendar => calendarRepo.create({ churchId, ...calendar })));
}
