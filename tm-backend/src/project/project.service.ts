import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import {ProjectQueryDto} from './dto/project.query.dto.js'
import { PermissionService } from '../permission/permission.service.js';
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';
@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService, private permissionService: PermissionService) {}

  async findAll(user: AuthUser, query: ProjectQueryDto) {

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1 ) * limit;

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      OR:[{createdById: user.id}, {members:{some:{userId: user.id}}}]
    }

    if(query.workspaceId){
      where.workspaceId = query.workspaceId
    }

    if(query.workspaceId){
      where.workspaceId = query.workspaceId
    }

    if(query.search){
      where.name = {
        contains: query.search,
        mode: 'insensitive'
      }
    }

    //query lay data va count
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where, skip, take:limit, orderBy:{
          [query.sortBy ?? "createdAt"]: query.sortOrder ?? 'desc'
        },
        include:{
          createdBy:{
            select:{id: true, email: true, name: true}
          },
          members:{
            select:{
              user:{
                select:{
                  id: true, email: true, name: true
                }
              }
            }
          },
          tasks:{
            select:{
              id: true,
              title: true
            }
          }
        }
      }),
      this.prisma.project.count({where})
    ])

    return{
      projects, total, page, limit, totalPages: Math.ceil(total/limit)
    }
  }

  async findOne(id: string, user: AuthUser) {
    const project = await this.prisma.project.findFirst({
      where:{
        id,
        deletedAt: null,
      },
      include:{
        members: true,
        tasks:{
          select:{id:true, title:true}
        }
      }
    })

    if(!project){
      throw new NotFoundException('Can not find this project')
    }

    const canView = 
    project.createdById === user.id || 
    project.members.some(member => member.userId === user.id)

    if(!canView){
      throw new ForbiddenException('You do not has permission to view this project')
    }

    return project
  }

  async createProject(dto: CreateProjectDto, user: AuthUser) {
    const workspace = await this.prisma.workspace.findUnique({
      where:{
        id: dto.workspaceId
      },
      include:{
        members: true
      }
    })

    if(!workspace){
      throw new BadRequestException('Can not find this workspace')
    }

    const isWorkspaceMember = workspace.members.some(member => member.userId === user.id)
    if(!isWorkspaceMember){
      throw new ForbiddenException('You are not a member in this workspace')
    }

    return this.prisma.project.create({
      data:{          
        workspaceId: workspace.id,
        createdById: user.id,
        name: dto.name.trim(),
        description: dto.description
      }
    })

  }

  async updateProject(id: string, dto: UpdateProjectDto, user: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where:{
        id,
        deletedAt: null
      }
    })

    if(!project){
      throw new BadRequestException('Cannot find this project');
    }

    const isOwner = project.createdById === user.id
    if(!isOwner){
      throw new ForbiddenException('You are not owner project')
    }

    const data: Prisma.ProjectUpdateInput = {
      updatedAt: new Date()
    }

    if(dto.name){
      data.name = dto.name.trim()
    }

    if(dto.description){
      data.description = dto.description
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where:{
        userId_workspaceId: {userId: user.id, workspaceId: project.workspaceId,  }
      },
      include:{
        role:{
          include:{
            permissions:{
              include:{
                permission:{
                  select:{
                    key: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if(!member){
      throw new NotFoundException('You are not a workspace member')
    }

    const hasPermission = member.role.permissions.some(p => p.permission.key === PERMISSION_KEYS.PROJECT_UPDATE)
    const isProjectCreator = project.createdById === user.id 
    const isSuperAdmin = await this.permissionService.isSuperAdmin(user.id);
    if(!isProjectCreator && !isSuperAdmin && !hasPermission ){
      throw new ForbiddenException(
'You do not have permission to update this project',);
    }

    return this.prisma.project.update({
      where:{
        id: project.id
      },
      data
    });
  }

  async deleteProject(id: string, user: AuthUser) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new NotFoundException('Cannot find this project');
    }

    const isProjectCreator = project.createdById === user.id;
    const isSuperAdmin = await this.permissionService.isSuperAdmin(user.id);
    const hasPermission = await this.permissionService.hasPermission(
      project.workspaceId,
      user.id,
      PERMISSION_KEYS.PROJECT_DELETE,
    );

    if (!isProjectCreator && !isSuperAdmin && !hasPermission) {
      throw new ForbiddenException('You do not have permission to delete this project');
    }


    return this.prisma.$transaction(async tx => {
      await tx.project.update({ 
        where: { id }, data: { deletedAt: new Date() } 
      });
      await tx.projectMember.updateMany({
        where: { projectId: id },
        data: { deletedAt: new Date() }
      });
    });
  }

  async assertProjectMember(projectId: string, userId: string) {
    const isSuperAdmin = await this.permissionService.isSuperAdmin(userId);
    if (isSuperAdmin) return;

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
      select: {
        createdById: true,
        members: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isMember = project.createdById === userId || project.members.length > 0;
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this project');
    }
  }

    

}
