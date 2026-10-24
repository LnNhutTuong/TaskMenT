import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UpsertMetricValueDTO } from './dto/upsert-metric-value.dto.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TaskService } from '../task/task.service.js';
import { MetricService } from '../metric/metric.service.js';
import { PermissionService } from '../permission/permission.service.js';
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';

@Injectable()
export class TaskMetricValueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskService: TaskService,
    private readonly metricService: MetricService,
    private readonly permissionService: PermissionService
  ) {}

  async upsert(dto: UpsertMetricValueDTO, user: AuthUser) {
    const task = await this.taskService.findOne(dto.taskId, user)

    const metric = await this.metricService.findOne(dto.metricId, user);

    const isSameWorkspace = task.workspaceId  === metric.workspaceId
    
    if(!isSameWorkspace){
      throw new BadRequestException('Task and metric are not in the same Workspace')
    } 

    const isAssignee = task.taskAssignees?.some(
      (a: any) => a.userId === user.id || a.user?.id === user.id
    );
    const hasKpiCalcPerm = await this.permissionService.hasPermission(
      task.workspaceId,
      user.id,
      PERMISSION_KEYS.KPI_CALCULATE,
      task.project?.id
    );

    if (!isAssignee && !hasKpiCalcPerm) {
      throw new ForbiddenException('You must be assigned to this task or have KPI_CALCULATE permission');
    }

    return this.prisma.taskMetricValue.upsert({
      where:{
        taskId_metricId: {
          taskId: dto.taskId,
          metricId: dto.metricId
        }
      },
      update:{
        value: dto.value,
      },
      create:{
        taskId: dto.taskId,
        metricId: dto.metricId,
        value: dto.value
      }
    })
  }

  async findByTask(taskId: string, user:AuthUser){
    const task = await this.taskService.findOne(taskId,user);

    if(!task){
      throw new NotFoundException('Task not found');
    }

    const taskMetricValue = await this.prisma.taskMetricValue.findMany({
      where:{
        taskId: taskId
      },
      include:{
        metric: true
      }
    })

    return taskMetricValue;
  }

   async remove(taskId: string, metricId: string, user: AuthUser){
    const taskMetricValue = await this.prisma.taskMetricValue.findUnique({
      where:{
        taskId_metricId: {
          taskId: taskId,
          metricId: metricId
        }
      }
    })

    if(!taskMetricValue){
      throw new NotFoundException('Task metric value not found');
    }

    await this.taskService.assertTaskPermission(taskMetricValue.taskId,user.id);

    return this.prisma.taskMetricValue.delete({
      where:{
        taskId_metricId: {
          taskId: taskId,
          metricId: metricId
        }
      }
    })
  }

}
