import { Module } from '@nestjs/common';
import { KeyResultService } from './key-result.service.js';
import { KeyResultController } from './key-result.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';
import { PermissionModule } from '../permission/permission.module.js';

@Module({
  controllers: [KeyResultController],
  providers: [KeyResultService],
  imports: [PrismaModule, AuthModule, WorkspaceModule, PermissionModule],
})
export class KeyResultModule {}
