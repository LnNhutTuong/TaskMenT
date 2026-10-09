import { SetMetadata } from '@nestjs/common';
export const PERMISSION_KEY = 'required_permission';
export const RequirePermission = (key: string) =>
  SetMetadata(PERMISSION_KEY, key);
