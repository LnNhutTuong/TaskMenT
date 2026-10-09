import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskOutputDto } from './dto/create-task-output.dto.js';
import { UpdateTaskOutputDto } from './dto/update-task-output.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { TaskService } from '../task/task.service.js';
import { ProjectService } from '../project/project.service.js';
import {PermissionService} from '../permission/permission.service.js'
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';

@Injectable()
export class TaskOutputService {
    constructor(private readonly prisma:PrismaService, 
      private readonly taskService: TaskService, 
      private readonly projectService: ProjectService, 
      private readonly permissionService: PermissionService){}

    async create(dto: CreateTaskOutputDto, user: AuthUser){
      const task = await this.taskService.findOne(dto.taskId, user);

      await this.projectService.assertProjectMember(task.project.id, user.id);
      await this.permissionService.assertPermission(task.project.workspaceId, user.id, PERMISSION_KEYS.OUTPUT_CREATE)

      return this.prisma.taskOutput.create({
        data:{
          taskId: task.id,
          title: dto.title,
          description: dto.description,
          expectedType: dto.expectedType,
        }
      })
    }

    async findOne(taskOutputId: string, user:AuthUser){
      const taskOutput = await this.prisma.taskOutput.findUnique({
        where:{
          id: taskOutputId
        },
        include:{
          task:{
            select:{
              id: true
            }
          }
        }
      })

      if(!taskOutput){
        throw new NotFoundException('Task output not found');
      }

      await this.taskService.assertTaskPermission(taskOutput.task.id, user.id)
      
      return taskOutput;
    }

    async findByTaskId(taskId: string, user: AuthUser){
      const task = await this.taskService.findOne(taskId, user);

      return this.prisma.taskOutput.findMany({
        where:{
          taskId: task.id
        },
        omit:{
          taskId: true,    
        },
        include:{
          task:{
            select:{
              id: true, title: true
            },
          },
          evidences: true
        }
      })
    }

    async update(dto: UpdateTaskOutputDto, id: string, user: AuthUser){
      const taskOutput = await this.prisma.taskOutput.findUnique({
        where:{
          id
        },
        include:{
          task:{
            select:{
              id: true,
              project:{
                select:{
                  workspaceId: true
                }
              }
            },
          }
        }
      })

      if(!taskOutput){
        throw new NotFoundException('Task output not found');
      }

      await this.taskService.assertTaskPermission(taskOutput.task.id, user.id)
      await this.permissionService.assertPermission(taskOutput.task.project.workspaceId, user.id, PERMISSION_KEYS.OUTPUT_UPDATE)

      const taskOutputAfterUpdate = await this.prisma.taskOutput.update({
        where:{
          id: taskOutput.id
        },
        data:{
          title: dto.title,
          description: dto.description,
          expectedType: dto.expectedType
        }
      })

      return this.prisma.taskOutput.findUnique({
        where:{
          id: taskOutputAfterUpdate.id
        }
      })


    }

    async delete(id: string,  user: AuthUser){
      const taskOutput = await this.prisma.taskOutput.findUnique({
        where:{
          id
        },
        include:{
          task:{
            select:{
              id: true,
              project:{
                select:{
                  workspaceId: true
                }
              }
            },
          }
        }
      })


      if(!taskOutput){
        throw new NotFoundException('Task output not found')
      }

      await this.taskService.assertTaskPermission(taskOutput.task.id, user.id)
      await this.permissionService.assertPermission(taskOutput.task.project.workspaceId, user.id, PERMISSION_KEYS.OUTPUT_DELETE)

      return this.prisma.taskOutput.delete({
        where:{
          id: taskOutput.id
        }
      })

    }

}
