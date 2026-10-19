import { Injectable } from '@nestjs/common';
import { CreateEvaluationPeriodDto } from './dto/create-evaluation-period.dto.js';
import { UpdateEvaluationPeriodDto } from './dto/update-evaluation-period.dto.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkspaceService } from '../workspace/workspace.service.js';
import {PermissionService} from '../permission/permission.service.js'
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';

@Injectable()
export class EvaluationPeriodService {
  constructor(
    private prisma: PrismaService,
    private workspaceService: WorkspaceService,
    private permissionService: PermissionService,
  ) {}

  async create(dto: CreateEvaluationPeriodDto, user: AuthUser) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: dto.workspaceId } });
    
    if(!workspace){
      throw new NotFoundException('Workspace not found');
    }
    
    await this.workspaceService.assertWorkspaceMember(workspace.id, user.id)

    if(dto.kpiWeight + dto.criteriaWeight !== 1.0){
      throw new BadRequestException('KPI weight and criteria weight must sum to 1.0');
    }

    if(dto.endDate < dto.startDate){
      throw new BadRequestException('End date must be after start date');
    }

    if(!dto.criteria.length){
      throw new BadRequestException('Criteria must not be empty');
    }

    return this.prisma.$transaction(async tx => {
      const period = await tx.evaluationPeriod.create({
        data:{
          workspaceId: workspace.id,
          name: dto.name,
          startDate: dto.startDate,
          endDate: dto.endDate,
          kpiWeight: dto.kpiWeight,
          criteriaWeight: dto.criteriaWeight,
        }
      })

      await tx.evaluationCriteria.createMany({
        data: dto.criteria.map(c => ({
          periodId: period.id,
          name: c.name,
          description: c.description,
          maxScore: c.maxScore,
        }))
      })

      return tx.evaluationPeriod.findUnique({
        where: {
          id: period.id
        },
        include: {
          criteria: {
            select: {
              id: true,
              name: true,
              maxScore: true
            }
          }
        }
      })
    })
  }

  async findAllByWorkspace(workspaceId: string, user: AuthUser) {
    const workspace = await this.prisma.workspace.findUnique({
      where: {id: workspaceId}
    })
    
    if(!workspace){
      throw new NotFoundException('Workspace not found');
    }

    await this.workspaceService.assertWorkspaceMember(workspace.id, user.id);

    return this.prisma.evaluationPeriod.findMany({
      where: {
        workspaceId: workspace.id
      },
      omit:{
        workspaceId: true,
      },
      orderBy:{
        createdAt: 'desc'
      },
      include: {
        criteria: {
          select: {
            id: true,
            name: true,
            maxScore: true
          }
        }
      }
    })
  }

  async findOne(id: string, user: AuthUser) {
    const period = await this.prisma.evaluationPeriod.findUnique({
      where: {
        id: id
      },
      include: {
        criteria: {
          select: {
            id: true,
            name: true,
            maxScore: true
          }
        }
      }
    })
    
    if(!period){
      throw new NotFoundException('Evaluation period not found');
    }

    await this.workspaceService.assertWorkspaceMember(period.workspaceId, user.id);

    return period;
  }

  async update(id: string, dto: UpdateEvaluationPeriodDto, user: AuthUser) {
    const period = await this.findOne(id, user)
    await this.permissionService.assertPermission(
      period.workspaceId,
      user.id,
      PERMISSION_KEYS.EVALUATION_PERIOD_UPDATE
    )
    
    if(dto.kpiWeight && dto.criteriaWeight && dto.kpiWeight + dto.criteriaWeight !== 1.0){
      throw new BadRequestException('KPI weight and criteria weight must sum to 1.0');
    }

    if(dto.endDate && dto.startDate && dto.endDate < dto.startDate){
      throw new BadRequestException('End date must be after start date');
    }

    if(dto.criteria && !dto.criteria.length){
      throw new BadRequestException('Criteria must not be empty');
    }

    return this.prisma.$transaction(async tx => {
      const updatedPeriod = await tx.evaluationPeriod.update({
        where: {
          id: id
        },
        data: {
          name: dto.name,
          startDate: dto.startDate,
          endDate: dto.endDate,
          kpiWeight: dto.kpiWeight,
          criteriaWeight: dto.criteriaWeight,
        },
      })

      if(dto.criteria !== undefined){
        await tx.evaluationCriteria.deleteMany({
          where:{
            periodId: id
          }
        })

        if(dto.criteria.length > 0){
          await tx.evaluationCriteria.createMany({
            data: dto.criteria.map(c => ({
              periodId: id,
              name: c.name,
              description: c.description,
              maxScore: c.maxScore,
            }))
          })
        }
      }

      return tx.evaluationPeriod.findUnique({
        where:{
          id: updatedPeriod.id
        },
        include: {
          criteria: {
            select: {
              id: true,
              name: true,
              maxScore: true
            }
          }
        }
      })
    })
  }

  async remove(id: string, user: AuthUser) {
    const period = await this.prisma.evaluationPeriod.findUnique({
      where: {
        id: id
      },
      include:{
        criteria:{
          select:{
            id: true, name: true, maxScore: true,
          }
        },
        evaluations:{
          select:{
            status: true
          }
        }
      }
    })
    
    if(!period){
      throw new NotFoundException('Evaluation period not found');
    }

    const isSubmited = period.evaluations.some(e => e.status === 'SUBMITTED' || e.status === 'APPROVED')
    if(isSubmited){
      throw new BadRequestException('Evaluation period cannot be deleted because it has been submitted');
    } 

    await this.permissionService.assertPermission(period.workspaceId, user.id, PERMISSION_KEYS.EVALUATION_PERIOD_DELETE)

    return this.prisma.evaluationPeriod.delete({
      where:{
        id: id
      }
    })
  }
}
