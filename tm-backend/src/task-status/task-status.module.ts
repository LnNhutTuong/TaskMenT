import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { TaskStatusService } from './task-status.service.js';
import { TaskStatusController } from './task-status.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [TaskStatusService],
  controllers: [TaskStatusController],
})
export class TaskStatusModule {}
