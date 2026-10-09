import {Injectable, CanActivate, ExecutionContext} from '@nestjs/common'
import { PermissionService } from '../permission.service.js';
import { AuthUser } from '../../auth/types/jwt-payload.type.js';

//Chỉ dùng khi muốn xem toàn bộ workspaces, users,..

@Injectable()
export class SystemGuard implements CanActivate {
  constructor(private permissionService: PermissionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;
    await this.permissionService.assertSuperAdmin(user.id);
    return true;
  }
}