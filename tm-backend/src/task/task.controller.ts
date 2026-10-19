import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import { TaskQueryDTO } from './dto/task-query.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('task')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get()
  async getAllTasks(
    @CurrentUser() user: AuthUser,
    @Query() query: TaskQueryDTO,
  ) {
    let tasks = await this.taskService.findAll(user, query);

    return {
      message: 'Get all tasks successfully',
      data: tasks,
    };
  }

  @Get(`:id`)
  async findOne(@Param(`id`) id: string, @CurrentUser() user: AuthUser) {
    let task = await this.taskService.findOne(id, user);

    return {
      message: 'Get task with id successfully',
      data: task,
    };
  }

  @Post(`create`)
  async createTask(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthUser) {
    let task = await this.taskService.createTask(dto, user);
    return {
      message: 'Create new task successfully',
      data: task,
    };
  }

  @Patch(`:id`)
  async updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    const task = await this.taskService.updateTask(id, dto, user);

    return {
      message: 'Update task successfully',
      data: task,
    };
  }

  @Delete(':id')
  async deleteTask(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.taskService.deleteTask(id, user);

    return {
      message: 'Delete task successfully',
      data: id,
    };
  }

  @Get(':taskId/key-results')
  async findAllKeyResultsLinkedToTask(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const keyResultsLinkedToTask = await this.taskService.findAllKeyResultsLinkedToTask(taskId, user);

    return {
      message: 'Find all key result linked to task successfully',
      data: keyResultsLinkedToTask,
    };
  }

  @Post(`:taskId/key-results/:keyResultId/link`)
  async linkTaskToKeyResult(
    @Param('taskId') taskId: string,
    @Param('keyResultId') keyResultId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const taskKeyResult = await this.taskService.LinkTaskToKeyResult(taskId, keyResultId, user);

    return {
      message: 'Link task to key result successfully',
      data: taskKeyResult,
    };
  }

  @Delete(`:taskId/key-results/:keyResultId/unlink`)
  async unlinkTaskToKeyResult(
    @Param('taskId') taskId: string,
    @Param('keyResultId') keyResultId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const taskKeyResult = await this.taskService.UnLinkTaskToKeyResult(taskId, keyResultId, user);

    return {
      message: 'Unlink task to key result successfully',
      data: taskKeyResult,
    };
  }
}
