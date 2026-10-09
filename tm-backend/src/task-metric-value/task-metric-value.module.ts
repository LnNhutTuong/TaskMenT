import { Module } from '@nestjs/common';
import { TaskMetricValueService } from './task-metric-value.service.js';
import { TaskMetricValueController } from './task-metric-value.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { TaskModule } from '../task/task.module.js';
import { MetricModule } from '../metric/metric.module.js';
import { PermissionModule } from '../permission/permission.module.js';

@Module({
  controllers: [TaskMetricValueController],
  providers: [TaskMetricValueService],
  imports: [PrismaModule, AuthModule, TaskModule, MetricModule, PermissionModule]
})
export class TaskMetricValueModule {}
