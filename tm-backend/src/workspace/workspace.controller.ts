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
import { WorkspaceService } from './workspace.service.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';
import { WorkspaceQueryDto } from './dto/workspace.query.dto.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { RequirePermission } from '../permission/decorations/permission.decoration.js';
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post('create')
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
