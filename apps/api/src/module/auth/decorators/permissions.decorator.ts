import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../permissions';

export const PERMISSIONS_KEY = 'required_permissions';

/** 핸들러/컨트롤러에 필요한 권한 지정. 모두 충족해야 통과. */
export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
