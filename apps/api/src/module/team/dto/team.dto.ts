import { IsEmail, IsEnum } from 'class-validator';
import { MembershipRole } from '@src/database/entities/membership.entity';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(MembershipRole)
  role!: MembershipRole;
}

export class UpdateRoleDto {
  @IsEnum(MembershipRole)
  role!: MembershipRole;
}
