import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { TaskStatusService } from './task-status.service.js';

class CreateTaskStatusDto {
  @ApiProperty()
  key: string;

  @ApiProperty({ required: false })
  name?: string;
}

class UpdateTaskStatusDto {
  @ApiProperty({ required: false })
  key?: string;

  @ApiProperty({ required: false })
  name?: string;
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('TASK STATUS')
@Controller('project')
export class TaskStatusController {
  constructor(private readonly taskStatusService: TaskStatusService) {}

  @Get(':projectId/task-status')
  @ApiOperation({ summary: 'Get all task statuses in a project' })
  @ApiParam({ name: 'projectId', type: String })
  @ApiResponse({ status: 200, description: 'Statuses fetched successfully' })
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const statuses = await this.taskStatusService.findAll(projectId, user);
    return {
      message: 'Get all task status successfully',
      data: statuses,
    };
  }

  @Post(':projectId/task-status')
  @ApiBody({ type: CreateTaskStatusDto })
  @ApiOperation({ summary: 'Create a task status in a project' })
  @ApiParam({ name: 'projectId', type: String })
  @ApiResponse({ status: 201, description: 'Status created successfully' })
  async createStatus(
    @Param('projectId') projectId: string,
    @Body() body: { key: string; name?: string },
    @CurrentUser() user: AuthUser,
  ) {
    const status = await this.taskStatusService.createStatus(
      projectId,
      user,
      body.key,
      body.name,
    );

    return {
      message: 'Create task status successfully',
      data: status,
    };
  }

  @Patch(':projectId/task-status/:statusId')
  @ApiBody({ type: UpdateTaskStatusDto })
  @ApiOperation({ summary: 'Update a task status' })
  @ApiParam({ name: 'projectId', type: String })
  @ApiParam({ name: 'statusId', type: String })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @Body() body: { key?: string; name?: string },
    @CurrentUser() user: AuthUser,
  ) {
    const status = await this.taskStatusService.updateStatus(projectId, statusId, user, body);
    return {
      message: 'Update task status successfully',
      data: status,
    };
  }

  @Delete(':projectId/task-status/:statusId')
  @ApiOperation({ summary: 'Delete a task status' })
  @ApiParam({ name: 'projectId', type: String })
  @ApiParam({ name: 'statusId', type: String })
  @ApiResponse({ status: 200, description: 'Status deleted successfully' })
  async deleteStatus(
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.taskStatusService.deleteStatus(projectId, statusId, user);
    return {
      message: 'Delete task status successfully',
      data: result,
    };
  }
}
