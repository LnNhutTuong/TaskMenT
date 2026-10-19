import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EvaluationPeriodService } from './evaluation-period.service.js';
import { CreateEvaluationPeriodDto } from './dto/create-evaluation-period.dto.js';
import { UpdateEvaluationPeriodDto } from './dto/update-evaluation-period.dto.js';
import {  RequirePermission } from '../permission/decorations/permission.decoration.js';
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';

@Controller('evaluation-period')
export class EvaluationPeriodController {
  constructor(private readonly evaluationPeriodService: EvaluationPeriodService) {}

  @RequirePermission(PERMISSION_KEYS.EVALUATION_PERIOD_CREATE)
  @Post('create')
  async create(@Body() dto: CreateEvaluationPeriodDto, @CurrentUser() user: AuthUser) {
    const period = await this.evaluationPeriodService.create(dto, user);
    return{
      message: 'Create evaluation period successfully',
      data: period
    }
  }

  @Get('workspace/:workspaceId')
  async findAllByWorkspace(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthUser) {
    const periods = await this.evaluationPeriodService.findAllByWorkspace(workspaceId, user);
    return{
      message: 'Get evaluation periods successfully',
      data: periods
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const period = await this.evaluationPeriodService.findOne(id, user);
    return{
      message: 'Get evaluation period successfully',
      data: period
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEvaluationPeriodDto, @CurrentUser() user: AuthUser) {
    const period = await this.evaluationPeriodService.update(id, dto, user);
    return{
      message: 'Update evaluation period successfully',
      data: period
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.evaluationPeriodService.remove(id, user);
    return{
      message: 'Delete evaluation period successfully',
    }
  }


}
