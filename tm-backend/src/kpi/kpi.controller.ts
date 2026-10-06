import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { KpiService } from './kpi.service.js';

import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('task/:taskId')
  async findOne(@Param('taskId') taskId: string, @CurrentUser() user: AuthUser) {
    const kpi = await this.kpiService.findOne(taskId, user);

    return {
      message: 'Get KPI successfully',
      data: kpi
    }
  }

  @Post('calculate/:taskId')
  async calculateKpi(@Param('taskId') taskId: string, @CurrentUser() user: AuthUser) {
    const kpi = await this.kpiService.caculatorKpi(taskId, user);

    return {
      message: 'Calculate KPI successfully',
      data: kpi
    }
  }
}
