import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassificationRuleDto } from './dto/create-classification-rule.dto.js';
import { UpdateClassificationRuleDto } from './dto/update-classification-rule.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { PermissionService } from '../permission/permission.service.js';  
import { WorkspaceService } from '../workspace/workspace.service.js';
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';

@Injectable()
export class ClassificationRuleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceService: WorkspaceService,
    private readonly permissionService: PermissionService,
  ) {}

  async create(dto: CreateClassificationRuleDto, user: AuthUser) {

    const workspace = await this.prisma.workspace.findUnique({where: {id: dto.workspaceId}})

    if (!workspace) {
      throw new Error('Workspace not found')
    }

    if(dto.minScore < 0 && dto.maxScore > 10 && dto.minScore > dto.maxScore ){
      throw new BadRequestException('invalid score range')
    }

    return await this.prisma.classificationRule.create({
      data:{
        workspaceId: workspace.id,
        grade: dto.grade,
        label: dto.label,
        minScore: dto.minScore,
        maxScore: dto.maxScore,
        description: dto.desciption
      }
    })
  }

  async findByWorkspace(workspaceId: string, user: AuthUser) { 
    await this.workspaceService.assertWorkspaceMember(workspaceId, user.id)
    const classificationRules = await this.prisma.classificationRule.findMany({
      where: {
        workspaceId
      }
    })
    return classificationRules
  }

  async update(id: string, dto: UpdateClassificationRuleDto, user: AuthUser) {
    const rule = await this.prisma.classificationRule.findUnique({where: {id: id}})

    if (!rule) {
      throw new NotFoundException('Rule not found')
    }

    await this.permissionService.assertPermission(rule.workspaceId, user.id,PERMISSION_KEYS.CLASSIFICATION_MANAGE)

    if(dto.minScore! < 0 && dto.maxScore! > 10 && dto.minScore! > dto.maxScore! ){
      throw new BadRequestException('invalid score range')
    }

    return await this.prisma.classificationRule.update({
      where: {id: id},
      data: {
        grade: dto.grade,
        label: dto.label,
        minScore: dto.minScore,
        maxScore: dto.maxScore,
        description: dto.desciption
      }
    })
    
  }

  async remove(id: string, user: AuthUser) {
    const rule = await this.prisma.classificationRule.findUnique({where: {id: id}})

    if (!rule) {
      throw new Error('Rule not found')
    }
    
    await this.permissionService.assertPermission(rule.workspaceId, user.id,PERMISSION_KEYS.CLASSIFICATION_MANAGE)

    await this.prisma.classificationRule.delete({
      where: {id: id}
    })
  }
}
