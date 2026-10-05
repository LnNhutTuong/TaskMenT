import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TaskMetricValueService } from './task-metric-value.service.js';
import { UpsertMetricValueDTO } from './dto/upsert-metric-value.dto.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('task-metric-value')
export class TaskMetricValueController {
  constructor(private readonly taskMetricValueService: TaskMetricValueService) {}

  @Post()
  async upsert(@Body() dto:UpsertMetricValueDTO, @CurrentUser() user: AuthUser){
    const taskMetricValue = await this.taskMetricValueService.upsert(dto, user)
    return{
      message: 'Upsert metric value successfully',
      data: taskMetricValue
    }
  }

  @Get('task/:taskId')
  async findByTask(@Param('taskId') taskId:string, @CurrentUser() user: AuthUser){
    const taskMetricValue = await this.taskMetricValueService.findByTask(taskId,user);
    return{
      message: 'Find by task successfully',
      data: taskMetricValue
    }
  }

  @Delete(':taskId/:metricId')
  async remove(@Param('taskId') taskId:string, @Param('metricId') metricId:string, @CurrentUser() user: AuthUser){
    const taskMetricValue = await this.taskMetricValueService.remove(taskId,metricId,user);
    return{
      message: 'Remove task metric value successfully',
      data: taskMetricValue
    }
  }

}
