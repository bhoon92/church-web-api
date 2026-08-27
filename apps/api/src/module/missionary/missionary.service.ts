import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { DataSources } from '@src/database/data-sources';
import { MemberEntity } from '@src/database/entities/member.entity';
import { MemberStatusEntity } from '@src/database/entities/member-status.entity';
import { MinistryEntity } from '@src/database/entities/ministry.entity';
import { ACTIVE_MISSIONARY_STAGES, MissionaryProfileEntity, MissionaryStage } from '@src/database/entities/missionary-profile.entity';
import { MissionaryStageHistoryEntity } from '@src/database/entities/missionary-stage-history.entity';
import { ChangeStageDto, CreateMissionaryDto, ListMissionaryQueryDto, UpdateMissionaryDto } from './dto/missionary.dto';

export type MissionaryItem = {
  id: number;
  memberId: number;
  memberName: string;
  stage: MissionaryStage;
  country: string | null;
  region: string | null;
  fieldWork: string | null;
  ministryId: number | null;
  ministryName: string | null;
  commissionedAt: string | null;
  departedAt: string | null;
  endedAt: string | null;
  note: string | null;
};

/** 파송 현황 요약 — 대시보드/목록 헤더용. */
export type MissionarySummary = {
  active: number;
  byStage: Record<MissionaryStage, number>;
  commissionedThisYear: number;
};

/** 재적상태 systemKey — 파송 단계와 연동되는 값. */
const STATUS_KEY_COMMISSIONED = 'commissioned';
const STATUS_KEY_WORKER = 'worker';

@Injectable()
export class MissionaryService {
  private repo() {
    return DataSources.instance.getRepository(MissionaryProfileEntity);
  }

  private historyRepo() {
    return DataSources.instance.getRepository(MissionaryStageHistoryEntity);
  }

  async list(churchId: number, query: ListMissionaryQueryDto): Promise<MissionaryItem[]> {
    const where = {
      churchId,
      ...(query.stage ? { stage: query.stage } : {}),
      ...(!query.stage && query.scope === 'active' ? { stage: In(ACTIVE_MISSIONARY_STAGES) } : {}),
    };
    const profiles = await this.repo().find({ where, order: { stage: 'ASC', id: 'ASC' } });
    return this.enrich(churchId, profiles);
  }

  async findByMember(churchId: number, memberId: number): Promise<MissionaryItem | null> {
    const profile = await this.repo().findOne({ where: { churchId, memberId } });
    if (!profile) return null;
    return (await this.enrich(churchId, [profile]))[0];
  }

  async detail(churchId: number, id: number): Promise<MissionaryItem & { history: MissionaryStageHistoryEntity[] }> {
    const profile = await this.assertProfile(churchId, id);
    const [item] = await this.enrich(churchId, [profile]);
    const history = await this.historyRepo().find({
      where: { churchId, missionaryId: id },
      order: { changedAt: 'DESC', id: 'DESC' },
    });
    return { ...item, history };
  }

  /** 파송 트랙 등록 — 교인 1명당 프로필 1개. 최초 단계도 이력으로 남긴다. */
  async create(churchId: number, accountId: number, dto: CreateMissionaryDto): Promise<MissionaryProfileEntity> {
    const member = await DataSources.instance.getRepository(MemberEntity).findOne({ where: { id: dto.memberId, churchId } });
    if (!member) throw new NotFoundException('교인을 찾을 수 없습니다.');

    const existing = await this.repo().findOne({ where: { churchId, memberId: dto.memberId } });
    if (existing) throw new ConflictException('이미 파송 트랙에 등록된 교인입니다.');

    const stage = dto.stage ?? MissionaryStage.CANDIDATE;

    return DataSources.instance.transaction(async manager => {
      const profile = await manager.getRepository(MissionaryProfileEntity).save(
        manager.getRepository(MissionaryProfileEntity).create({
          churchId,
          memberId: dto.memberId,
          stage,
          country: dto.country,
          region: dto.region,
          fieldWork: dto.fieldWork,
          ministryId: dto.ministryId,
          commissionedAt: dto.commissionedAt,
          departedAt: dto.departedAt,
          note: dto.note,
        })
      );

      await manager.getRepository(MissionaryStageHistoryEntity).save(
        manager.getRepository(MissionaryStageHistoryEntity).create({
          churchId,
          missionaryId: profile.id,
          fromStage: undefined,
          toStage: stage,
          changedAt: this.today(),
          recorderAccountId: accountId,
          note: '파송 트랙 등록',
        })
      );

      await this.syncMemberStatus(manager, churchId, dto.memberId, stage);
      return profile;
    });
  }

  /** 프로필 정보만 갱신한다. memberId·stage 는 여기서 바꿀 수 없다(단계는 changeStage 로 이력을 남겨야 함). */
  async update(churchId: number, id: number, dto: UpdateMissionaryDto): Promise<MissionaryProfileEntity> {
    await this.assertProfile(churchId, id);
    await this.repo().update({ id, churchId }, this.editableFields(dto));
    return this.assertProfile(churchId, id);
  }

  /** 보낸 필드만 남긴다 — undefined 를 그대로 넘기면 컬럼이 NULL 로 덮일 수 있다. */
  private editableFields(dto: UpdateMissionaryDto): Partial<MissionaryProfileEntity> {
    const editable = ['country', 'region', 'fieldWork', 'ministryId', 'commissionedAt', 'departedAt', 'note'] as const;
    const patch: Partial<MissionaryProfileEntity> = {};
    for (const key of editable) {
      if (dto[key] !== undefined) Object.assign(patch, { [key]: dto[key] });
    }
    return patch;
  }

  /**
   * 단계 전이 — 이력을 남기고 재적상태까지 함께 맞춘다.
   * 파송(commissioned/field/furlough) 진입 시 재적상태가 '파송'이 되어 출석 명단에서 빠지고,
   * 복귀(returned/ended) 시 '사역자'로 되돌아온다 (planning 00.4).
   */
  async changeStage(churchId: number, id: number, accountId: number, dto: ChangeStageDto): Promise<MissionaryProfileEntity> {
    const profile = await this.assertProfile(churchId, id);
    if (profile.stage === dto.stage) return profile;

    const changedAt = dto.changedAt ?? this.today();

    return DataSources.instance.transaction(async manager => {
      const patch: Partial<MissionaryProfileEntity> = { stage: dto.stage };
      // 단계 전이 시점을 날짜 필드에도 반영해 두면 이후 통계에서 이력을 다시 뒤지지 않아도 된다.
      // 현지/안식년으로 바로 건너뛰어도 commissionedAt 을 채운다 — 비워두면 "올해 파송" 집계에서 빠진다.
      const commissioned = [MissionaryStage.COMMISSIONED, MissionaryStage.FIELD, MissionaryStage.FURLOUGH];
      if (commissioned.includes(dto.stage) && !profile.commissionedAt) patch.commissionedAt = changedAt;
      if (dto.stage === MissionaryStage.FIELD && !profile.departedAt) patch.departedAt = changedAt;
      if (dto.stage === MissionaryStage.RETURNED || dto.stage === MissionaryStage.ENDED) patch.endedAt = changedAt;

      await manager.getRepository(MissionaryProfileEntity).update({ id, churchId }, patch);
      await manager.getRepository(MissionaryStageHistoryEntity).save(
        manager.getRepository(MissionaryStageHistoryEntity).create({
          churchId,
          missionaryId: id,
          fromStage: profile.stage,
          toStage: dto.stage,
          changedAt,
          recorderAccountId: accountId,
          note: dto.note,
        })
      );

      await this.syncMemberStatus(manager, churchId, profile.memberId, dto.stage);

      return (await manager.getRepository(MissionaryProfileEntity).findOne({ where: { id, churchId } }))!;
    });
  }

  async remove(churchId: number, id: number): Promise<void> {
    await this.assertProfile(churchId, id);
    await DataSources.instance.transaction(async manager => {
      await manager.getRepository(MissionaryStageHistoryEntity).softDelete({ churchId, missionaryId: id });
      await manager.getRepository(MissionaryProfileEntity).softDelete({ id, churchId });
    });
  }

  async summary(churchId: number): Promise<MissionarySummary> {
    const profiles = await this.repo().find({ where: { churchId } });
    const byStage = Object.values(MissionaryStage).reduce(
      (acc, stage) => ({ ...acc, [stage]: profiles.filter(profile => profile.stage === stage).length }),
      {} as Record<MissionaryStage, number>
    );
    const year = new Date().getFullYear();
    return {
      active: profiles.filter(profile => ACTIVE_MISSIONARY_STAGES.includes(profile.stage)).length,
      byStage,
      commissionedThisYear: profiles.filter(profile => profile.commissionedAt?.startsWith(`${year}-`)).length,
    };
  }

  /** 파송 단계에 맞춰 교인의 재적상태를 옮긴다. 해당 systemKey 상태가 없으면 조용히 넘어간다. */
  private async syncMemberStatus(manager: EntityManager, churchId: number, memberId: number, stage: MissionaryStage): Promise<void> {
    const isActive = ACTIVE_MISSIONARY_STAGES.includes(stage);
    const isFinished = stage === MissionaryStage.RETURNED || stage === MissionaryStage.ENDED;
    if (!isActive && !isFinished) return;

    const systemKey = isActive ? STATUS_KEY_COMMISSIONED : STATUS_KEY_WORKER;
    const status = await manager.getRepository(MemberStatusEntity).findOne({ where: { churchId, systemKey } });
    if (!status) return;
    await manager.getRepository(MemberEntity).update({ id: memberId, churchId }, { statusId: status.id });
  }

  private async enrich(churchId: number, profiles: MissionaryProfileEntity[]): Promise<MissionaryItem[]> {
    if (profiles.length === 0) return [];

    const members = await DataSources.instance
      .getRepository(MemberEntity)
      .find({ where: { churchId, id: In(profiles.map(profile => profile.memberId)) } });
    const memberMap = new Map(members.map(member => [member.id, member.name]));

    const ministryIds = profiles.map(profile => profile.ministryId).filter((id): id is number => Boolean(id));
    const ministries =
      ministryIds.length > 0
        ? await DataSources.instance.getRepository(MinistryEntity).find({ where: { churchId, id: In(ministryIds) } })
        : [];
    const ministryMap = new Map(ministries.map(ministry => [ministry.id, ministry.name]));

    return profiles.map(profile => ({
      id: profile.id,
      memberId: profile.memberId,
      memberName: memberMap.get(profile.memberId) ?? '(삭제된 교인)',
      stage: profile.stage,
      country: profile.country ?? null,
      region: profile.region ?? null,
      fieldWork: profile.fieldWork ?? null,
      ministryId: profile.ministryId ?? null,
      ministryName: profile.ministryId ? (ministryMap.get(profile.ministryId) ?? null) : null,
      commissionedAt: profile.commissionedAt ?? null,
      departedAt: profile.departedAt ?? null,
      endedAt: profile.endedAt ?? null,
      note: profile.note ?? null,
    }));
  }

  private async assertProfile(churchId: number, id: number): Promise<MissionaryProfileEntity> {
    const profile = await this.repo().findOne({ where: { id, churchId } });
    if (!profile) throw new NotFoundException('선교사 프로필을 찾을 수 없습니다.');
    return profile;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
