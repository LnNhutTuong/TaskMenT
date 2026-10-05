import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MetricService } from './metric.service.js';
import { CreateMetricDto } from './dto/create-metric.dto.js';
import { UpdateMetricDto } from './dto/update-metric.dto.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('metric')
export class MetricController {
  constructor(private readonly metricService: MetricService) {}

  @Post('create')
  async create(@Body() dto: CreateMetricDto, @CurrentUser() user:AuthUser) {
    const metric = await  this.metricService.create(dto, user);
    return {
      message: 'Create new metric successfully',
      data: metric
    }
  }

  @Get('workspace/:workspaceId')
  async findByWorkspace(@Param('workspaceId') workspaceId: string, @CurrentUser() user:AuthUser) {
    const metrics = await this.metricService.findByWorkspace(workspaceId, user);
    return{
      message: 'Find metrics successfully',
      data: metrics
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMetricDto, @CurrentUser() user:AuthUser) {
    const metric = await this.metricService.update(id, dto, user);
    return {
      message: 'Update metric successfully',
      data: metric
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.metricService.remove(id, user);
    return {
      message: 'Delete metric successfully'
    }
  }
}
