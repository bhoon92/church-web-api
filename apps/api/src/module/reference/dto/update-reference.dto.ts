import { PartialType } from '@nestjs/mapped-types';
import { UpsertReferenceDto } from './upsert-reference.dto';

export class UpdateReferenceDto extends PartialType(UpsertReferenceDto) {}
