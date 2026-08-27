import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSources } from '@src/database/data-sources';
import { TrainingCohortEntity } from '@src/database/entities/training-cohort.entity';
import { TrainingCourseEntity, TrainingFormat } from '@src/database/entities/training-course.entity';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';

@Injectable()
export class TrainingCourseService {
  private repo() {
    return DataSources.instance.getRepository(TrainingCourseEntity);
  }

  async list(churchId: number): Promise<TrainingCourseEntity[]> {
    return this.repo().find({ where: { churchId }, order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async findById(churchId: number, id: number): Promise<TrainingCourseEntity> {
    const course = await this.repo().findOne({ where: { id, churchId } });
    if (!course) throw new NotFoundException('훈련 과정을 찾을 수 없습니다.');
    return course;
  }

  async create(churchId: number, dto: CreateCourseDto): Promise<TrainingCourseEntity> {
    return this.repo().save(
      this.repo().create({
        churchId,
        name: dto.name,
        format: dto.format ?? TrainingFormat.WEEKLY,
        defaultSessionCount: dto.defaultSessionCount ?? 1,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      })
    );
  }

  async update(churchId: number, id: number, dto: UpdateCourseDto): Promise<TrainingCourseEntity> {
    await this.findById(churchId, id);
    await this.repo().update({ id, churchId }, dto);
    return this.findById(churchId, id);
  }

  /** 기수가 하나라도 붙어 있으면 삭제 대신 비활성화를 유도한다 (이력 보호). */
  async remove(churchId: number, id: number): Promise<void> {
    await this.findById(churchId, id);
    const cohortCount = await DataSources.instance.getRepository(TrainingCohortEntity).count({ where: { churchId, courseId: id } });
    if (cohortCount > 0) {
      throw new ConflictException(`이미 ${cohortCount}개 기수가 있는 과정입니다. 삭제 대신 비활성화(isActive: false)하세요.`);
    }
    await this.repo().softDelete({ id, churchId });
  }
}
