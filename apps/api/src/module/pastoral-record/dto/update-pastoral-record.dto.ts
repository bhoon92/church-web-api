import { PartialType } from '@nestjs/mapped-types';
import { CreatePastoralRecordDto } from './create-pastoral-record.dto';

export class UpdatePastoralRecordDto extends PartialType(CreatePastoralRecordDto) {}
