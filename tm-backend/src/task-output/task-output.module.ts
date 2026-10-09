import { Module } from '@nestjs/common';
import { TaskOutputService } from './task-output.service.js';
import { TaskOutputController } from './task-output.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { TaskModule } from '../task/task.module.js';
import { ProjectModule } from '../project/project.module.js';
import { PermissionModule } from '../permission/permission.module.js';

@Module({
  controllers: [TaskOutputController],
  providers: [TaskOutputService],
  imports: [PrismaModule, AuthModule, TaskModule, ProjectModule, PermissionModule],
  exports: [TaskOutputService]
})
export class TaskOutputModule {}
