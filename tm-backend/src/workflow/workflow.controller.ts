import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { WorkflowService } from './workflow.service.js';
import { CreateWorkflowDto } from './dto/create-workflow.dto.js';
import { UpdateWorkflowDto } from './dto/update-workflow.dto.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}
  
  @Post('create')
  async create(@Body() dto: CreateWorkflowDto, @CurrentUser() user: AuthUser) {
    let workflow = await this.workflowService.create(dto, user);
    return{
      message: "Create workflow successfully",
      data: workflow
    }
  }

  @Get(':projectId')
  async findByProject(@Param('projectId') projectId: string, @CurrentUser() user: AuthUser){
    let workflow = await this.workflowService.findByProject(projectId, user);
    return{
      message: "Find workflow by project successfully",
      data: workflow
    }
  }

  @Get(':projectId/transitions')
  async getValidTransitions(@Param('projectId') projectId: string, @Query('from') from: string, @CurrentUser() user: AuthUser){
    let transition = await this.workflowService.getValidTransitions(projectId, from, user);
    return{
      message: "Get valid transitions successfully",
      data: transition
    }
  }

}
