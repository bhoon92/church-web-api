import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSources } from '@src/database/data-sources';
import { ChurchEntity, ChurchStatus } from '@src/database/entities/church.entity';
import { MembershipEntity, MembershipRole } from '@src/database/entities/membership.entity';
import { CreateChurchDto } from './dto/create-church.dto';

@Injectable()
export class ChurchService {
  /** 새 교회 생성 + 생성자를 OWNER 멤버십으로 자동 등록 */
  async create(accountId: number, dto: CreateChurchDto): Promise<{ church: ChurchEntity; membership: MembershipEntity }> {
    return DataSources.instance.transaction(async manager => {
      const church = await manager.getRepository(ChurchEntity).save(
        manager.getRepository(ChurchEntity).create({
          name: dto.name,
          representative: dto.representative,
          phone: dto.phone,
          address: dto.address,
          fiscalYearStartMonth: dto.fiscalYearStartMonth ?? 1,
          status: ChurchStatus.TRIAL,
        })
      );

      const membership = await manager.getRepository(MembershipEntity).save(
        manager.getRepository(MembershipEntity).create({
          accountId,
          churchId: church.id,
          role: MembershipRole.OWNER,
        })
      );

      return { church, membership };
    });
  }

  async findById(id: number): Promise<ChurchEntity> {
    const church = await DataSources.instance.getRepository(ChurchEntity).findOne({ where: { id } });
    if (!church) throw new NotFoundException('Church not found');
    return church;
  }
}
