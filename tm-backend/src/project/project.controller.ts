import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ProjectService } from './project.service.js';
import {ProjectQueryDto} from './dto/project.query.dto.js'
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('PROJECT')
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
@ApiOperation({ summary: 'Get all projects with pagination, search, sort' })
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
  @ApiOperation({ summary: 'Get project by id' })
  @ApiParam({ name: 'id', description: 'Project ID', type: String })
  @ApiResponse({ status: 200, description: 'Project fetched successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const project = await this.projectService.findOne(id, user);
    return {
      message: 'Get project successfully',
      data: project,
    };
  }

  @Post('create')
  @ApiBody({ type: CreateProjectDto })
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
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
  @ApiBody({ type: UpdateProjectDto })
  @ApiOperation({ summary: 'Update project information' })
  @ApiParam({ name: 'id', description: 'Project ID', type: String })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
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
  @ApiOperation({ summary: 'Delete a project' })
  @ApiParam({ name: 'id', description: 'Project ID', type: String })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  async deleteProject(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.projectService.deleteProject(id, user);
    return {
      message: 'Delete project successfully',
      data: result,
    };
  }
}
