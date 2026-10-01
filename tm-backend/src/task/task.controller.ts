import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import { TaskQueryDTO } from './dto/task-query.dto.js';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PriorityLevel } from '../generated/prisma/enums.js';
import { SortOrder } from '../generated/prisma/internal/prismaNamespace.js';
import {
  DeleteTaskResponseDto,
  GetAllTaskResponseDto,
  TaskResponseDto,
} from './dto/task-respone.dto.js';
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('TASK')
@Controller('task')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all tasks',
    description: 'Get tasks with filtering, pagination and sorting',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page is page',
    required: true,
    type: Number,
    minimum: 1,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Limit is quantity of task per page ',
    required: true,
    type: Number,
    minimum: 1,
    maximum: 10,
    example: 1,
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Sort task order ',
    required: true,
    enum: SortOrder,
    example: 'desc',
  })
  @ApiQuery({
    name: 'status',
    description: 'Status of task',
    required: false,
  })
  @ApiQuery({
    name: 'priority',
    description: 'Lever priority of task',
    required: false,
    enum: PriorityLevel,
  })
  @ApiQuery({
    name: 'deadline',
    description: 'Deadline of task',
    required: false,
    type: Date,
  })
  @ApiQuery({
    name: 'search',
    description: 'Key',
    required: false,
    type: String,
  })

  // SWG res
  @ApiResponse({
    status: 200,
    description: 'Get all task successfully',
    type: GetAllTaskResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
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
  @ApiParam({
    name: 'id',
    description: 'Task ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOperation({
    summary: 'Get task with id',
    description: 'Get tasks with id with ownership',
  })
  @ApiResponse({
    status: 200,
    description: 'Get task with id successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param(`id`) id: string, @CurrentUser() user: AuthUser) {
    let task = await this.taskService.findOne(id, user);

    return {
      message: 'Get task with id successfully',
      data: task,
    };
  }

  @Post(`create`)
  @ApiBody({ type: CreateTaskDto })
  @ApiOperation({
    summary: 'Create new task ',
    description: 'Create new task',
  })
  @ApiResponse({
    status: 201,
    description: 'Create new task successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid task data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTask(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthUser) {
    let task = await this.taskService.createTask(dto, user);
    return {
      message: 'Create new task successfully',
      data: task,
    };
  }

  @Patch(`:id`)
  @ApiParam({
    name: 'id',
    description: 'Task ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateTaskDto })
  @ApiOperation({
    summary: 'Update task',
    description: 'Update task with ownership',
  })
  @ApiResponse({
    status: 200,
    description: 'Update task successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid task data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
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
  @ApiParam({
    name: 'id',
    description: 'Task ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOperation({
    summary: 'Delete task',
    description: 'Delete task with ownership',
  })
  @ApiResponse({
    status: 200,
    description: 'Delete task successfully',
    type: DeleteTaskResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async deleteTask(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.taskService.deleteTask(id, user);

    return {
      message: 'Delete task successfully',
      data: id,
    };
  }
}
