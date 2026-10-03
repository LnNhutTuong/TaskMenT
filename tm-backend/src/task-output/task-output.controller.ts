import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TaskOutputService } from './task-output.service.js';
import { CreateTaskOutputDto } from './dto/create-task-output.dto.js';
import { UpdateTaskOutputDto } from './dto/update-task-output.dto.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('task-output')
export class TaskOutputController {
  constructor(private readonly taskOutputService: TaskOutputService) { }

  @Post('create')
  async create(@Body() dto: CreateTaskOutputDto, @CurrentUser() user: AuthUser) {
    const taskOutput = await this.taskOutputService.create(dto, user)
    return{
      message: 'Create new task output successfully',
      data: taskOutput
    }
  }

  @Get('task/:taskId')
  async findByTaskId(@Param('taskId') taskId: string, @CurrentUser() user: AuthUser){
    const taskOutputs = await this.taskOutputService.findByTaskId(taskId, user)
    return{
      message: 'Get all task outputs successfully',
      data: taskOutputs
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTaskOutputDto, @CurrentUser() user: AuthUser){
    const taskOutput = await this.taskOutputService.update(dto, id, user)
    return{
      message: 'Update task output successfully',
      data: taskOutput
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthUser){
    const taskOutput = await this.taskOutputService.delete(id, user);
    return{
      message: 'Delete task output successfully',
      data: taskOutput
    }
  }

  

}
