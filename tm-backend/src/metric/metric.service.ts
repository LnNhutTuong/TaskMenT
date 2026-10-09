import { BadRequestException, NotFoundException, Injectable } from '@nestjs/common';
import { CreateMetricDto } from './dto/create-metric.dto.js';
import { UpdateMetricDto } from './dto/update-metric.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { WorkspaceService } from '../workspace/workspace.service.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { PermissionService } from '../permission/permission.service.js';
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';


@Injectable()
export class MetricService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceService: WorkspaceService,
    private readonly permissionServiec: PermissionService
  ) {}

  async create(dto: CreateMetricDto, user: AuthUser) {
    const workspace = await this.workspaceService.findOne(dto.workspaceId, user);

    const keyExist = await this.prisma.metric.findUnique({
      where:{
        workspaceId_key: {
          key: dto.key,
          workspaceId: workspace.id
        }
      }
    })
    if (keyExist) {
      throw new BadRequestException('Metric key already exists');
    }

    const metric = await this.prisma.metric.create({
      data:{
        workspaceId: workspace.id,
        key: dto.key,
        name: dto.name,
        description: dto.description,
        unit: dto.unit
      }
    })

    return metric;
  }

  async findOne(metricId: string, user:AuthUser){
    const metric = await this.prisma.metric.findUnique({
      where:{
        id: metricId
      },
      include:{
        taskMetricValues:{
          select:{
            task:{
              select:{
                projectId: true,
              }
            }
          }
        }
      }
    })
    if(!metric){
      throw new NotFoundException('Metric not found');
    }
    await this.workspaceService.assertWorkspaceMember(metric.workspaceId, user.id);
    return metric;
  }

  async findByWorkspace(workspaceId: string, user: AuthUser) {
    const workspace = await this.workspaceService.findOne(workspaceId, user);

    const metrics = await this.prisma.metric.findMany({
      where:{
        workspaceId: workspace.id
      }
    })

    return metrics;
  
  }

  async update(id: string, dto: UpdateMetricDto, user: AuthUser) {

    const metric = await this.prisma.metric.findUnique({
      where:{
        id
      },
    })

    if(!metric){
      throw new NotFoundException('Metric not found')
    }

    await this.workspaceService.assertWorkspaceMember(metric.workspaceId, user.id)
    await this.permissionServiec.assertPermission(metric.workspaceId, user.id, PERMISSION_KEYS.METRIC_UPDATE)

    const metricAfterUpdate = await this.prisma.metric.update({
      where: {
        id: metric.id
      },
      data: {
        name: dto.name,
        description: dto.description,
        unit: dto.unit
      }
    })
    
    return this.prisma.metric.findUnique({
      where: {
        id: metricAfterUpdate.id
      }
    })
  }

  async remove(id: string, user: AuthUser) {
    const metric = await this.prisma.metric.findUnique({
      where: {
        id
      },
      include:{
        taskMetricValues:{
          select:{
            taskId: true,
          }
        }
      }
    })

    if(!metric){
      throw new NotFoundException('Metric not found')
    }

    await this.workspaceService.assertWorkspaceMember(metric.workspaceId, user.id)
    await this.permissionServiec.assertPermission(metric.workspaceId, user.id, PERMISSION_KEYS.METRIC_DELETE)

    if(metric.taskMetricValues.length > 0 ){
       throw new BadRequestException('This metric is already used in a task');
    }

    const result: string[] = await this.prisma.$queryRaw`
      SELECT id, name FROM "Formula" 
      WHERE "workspaceId" = ${metric.workspaceId}
      AND "expression" ~ ${'\\m' + metric.key + '\\M'}
      LIMIT 1
    `;

    if (result.length > 0) {
      throw new BadRequestException('This metric is already used in a formula');
    }

    await this.prisma.metric.delete({
      where: {
        id: metric.id
      }
    })

  }
}
