import { Module } from '@nestjs/common';
import { EvidenceService } from './evidence.service.js';
import { EvidenceController } from './evidence.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { TaskOutputModule } from '../task-output/task-output.module.js';
import { TaskModule } from '../task/task.module.js';
import { ProjectModule } from '../project/project.module.js';
import { PermissionModule } from '../permission/permission.module.js';

@Module({
  controllers: [EvidenceController],
  providers: [EvidenceService],
  imports: [PrismaModule, AuthModule, TaskOutputModule, TaskModule, ProjectModule, PermissionModule],
  exports: [EvidenceService]
})
export class EvidenceModule { }
