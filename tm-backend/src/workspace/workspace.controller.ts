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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';
import { WorkspaceQueryDto } from './dto/workspace.query.dto.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { RequirePermission } from '../permission/decorations/permission.decoration.js';
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';

@ApiBearerAuth()
@ApiTags('WORKSPACE')
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiBody({ type: CreateWorkspaceDto })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser() user: AuthUser,
  ) {
    const workspace = await this.workspaceService.create(createWorkspaceDto, user);
    return {
      message: 'Create workspace successfully',
      data: workspace,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all workspaces of current user' })
  @ApiResponse({ status: 200, description: 'Workspaces retrieved successfully' })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: WorkspaceQueryDto,
  ) {
    const result = await this.workspaceService.findAll(user, query);
    return {
      message: 'Get all workspaces successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details by ID' })
  @ApiParam({ name: 'id', description: 'Workspace ID', type: String })
  @ApiResponse({ status: 200, description: 'Workspace retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const workspace = await this.workspaceService.findOne(id, user);
    return {
      message: 'Get workspace successfully',
      data: workspace,
    };
  }

  @Patch(':workspaceId')
  @ApiOperation({ summary: 'Update workspace by ID' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
  @ApiBody({ type: UpdateWorkspaceDto })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  @ApiResponse({ status: 403, description: 'Missing permission to update workspace' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @RequirePermission(PERMISSION_KEYS.WORKSPACE_UPDATE)
  async update(
    @Param('workspaceId') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @CurrentUser() user: AuthUser,
  ) {
    const workspace = await this.workspaceService.update(id, updateWorkspaceDto, user);
    return {
      message: 'Update workspace successfully',
      data: workspace,
    };
  }

  @Delete(':workspaceId')
  @ApiOperation({ summary: 'Delete workspace by ID' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  @ApiResponse({ status: 403, description: 'Missing permission to delete workspace' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async remove(
    @Param('workspaceId') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.workspaceService.remove(id, user);
    return {
      message: 'Delete workspace successfully',
      data: result,
    };
  }
  
  // invite member
  @RequirePermission(PERMISSION_KEYS.WORKSPACE_INVITE)
  async inviteMember(){}

  // remove member
  @RequirePermission(PERMISSION_KEYS.WORKSPACE_REMOVE_MEMBER)
  async removeMember(){}
}
