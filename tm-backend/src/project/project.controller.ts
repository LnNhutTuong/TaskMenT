import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ProjectService } from './project.service.js';
import { ProjectQueryDto } from './dto/project.query.dto.js';
import { RequirePermission } from '../permission/decorations/permission.decoration.js';
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: ProjectQueryDto, // <-- Thêm query ở đây
  ) {
    const result = await this.projectService.findAll(user, query);
    return {
      message: 'Get all projects successfully',
      data: result.projects,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const project = await this.projectService.findOne(id, user);
    return {
      message: 'Get project successfully',
      data: project,
    };
  }

  @Post('create')
  @RequirePermission(PERMISSION_KEYS.PROJECT_CREATE)
  async createProject(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthUser,
  ) {
    const project = await this.projectService.createProject(dto, user);
    return {
      message: 'Create project successfully',
      data: project,
    };
  }

  @Patch(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthUser,
  ) {
    const project = await this.projectService.updateProject(id, dto, user);
    return {
      message: 'Update project successfully',
      data: project,
    };
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.projectService.deleteProject(id, user);
    return {
      message: 'Delete project successfully',
      data: result,
    };
  }
}
