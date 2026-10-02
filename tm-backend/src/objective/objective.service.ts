import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { CreateObjectiveDto } from './dto/create-objective.dto.js';
import { UpdateObjectiveDto } from './dto/update-objective.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ObjectiveQueryDto } from './dto/objective-query.dto.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { Prisma } from '../generated/prisma/client.js';
import { WorkspaceService } from '../workspace/workspace.service.js';

@Injectable()
export class ObjectiveService {
  constructor(private readonly prisma: PrismaService, private readonly workspaceService: WorkspaceService) {}

  async findAll(user: AuthUser, query: ObjectiveQueryDto) {
    const limit = query.limit ?? 10;
    const page =  query.page ?? 1;
    const skip = (page - 1) * limit;

    const where: Prisma.ObjectiveWhereInput={
      workspace:{
        members:{
          some:{
            userId: user.id
          }
        }
      }
    }

    if(query.workspaceId){
      where.workspaceId = query.workspaceId
    }

    if(query.projectId){
      where.projectId = query.projectId
    }

    const [objectives, total] = await Promise.all([
      this.prisma.objective.findMany({
        where,
        skip,
        take: limit,
        include: {
          keyResults:{
            select:{
              id: true, title: true, currentValue: true, targetValue: true
            }
          }
        }
      }),
      this.prisma.objective.count({
        where,
      })
    ])

    return {objectives, total, page, limit, totalPages: Math.ceil(total/limit)}
    
  }

  async findOne(id: string, user: AuthUser) {
    const objective = await this.prisma.objective.findUnique({
      where:{
        id,
        workspace:{
          members:{
            some:{
              userId: user.id
            }
          }
        }
      },
      include: {
        keyResults: {
          select: {
            id: true, title: true, currentValue: true, targetValue: true
          }
        }
      }
    })

    if(!objective){
      throw new NotFoundException('Objective not found')
    }

    return objective
  }

  async create(dto: CreateObjectiveDto, user: AuthUser){
    await this.workspaceService.assertWorkspaceMember(dto.workspaceId, user.id)

    if(dto.projectId){
      const project = await this.prisma.project.findUnique({
        where:{
          id: dto.projectId,
          workspaceId: dto.workspaceId
        }
      })

      if(!project){
        throw new NotFoundException('Project not found')
      }
    }

    return this.prisma.objective.create({
      data:{
        title: dto.title.trim(),       
        description: dto.description,
        startDate: dto.startDate,
        endDate: dto.endDate,      
        projectId: dto.projectId,
        workspaceId: dto.workspaceId,
      }
    })
  }

  async update(id: string, dto: UpdateObjectiveDto, user:AuthUser) {
    const objective = await this.prisma.objective.findUnique({
        where:{
          id,
        },
        include:{
          workspace:{
            select:{
              members:{
                select:{
                  userId: true
                }
              }
          }
        }
      }
    })

    if(!objective){
      throw new NotFoundException('Objective not found')
    }

    await this.workspaceService.assertWorkspaceMember(objective.workspaceId, user.id)

    return this.prisma.objective.update({
      where:{
        id,
      },
      data:{
        title: dto.title,
        description:dto.description,
        startDate: dto.startDate,
        endDate: dto.endDate,
        updatedAt: new Date(),
      }
    })
  } 

  async remove(id: string, user:AuthUser) {
    const objective = await this.prisma.objective.findUnique({
      where:{
        id,
      },
      include:{
        workspace:{
          select:{
            members:{
              select:{
                userId: true
              }
            }
        }
      }
    }
  })

    if(!objective){
      throw new NotFoundException('Objective not found')
    }

   await this.workspaceService.assertWorkspaceMember(objective.workspaceId, user.id)

    return this.prisma.objective.delete({
      where:{
        id,
      }
    })
  }
}
