import { Module } from '@nestjs/common';
import { ObjectiveService } from './objective.service.js';
import { ObjectiveController } from './objective.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';
import { PermissionModule } from '../permission/permission.module.js';

@Module({
  controllers: [ObjectiveController],
  providers: [ObjectiveService],
    imports: [PrismaModule, AuthModule, WorkspaceModule, PermissionModule],
  
})
export class ObjectiveModule {}
