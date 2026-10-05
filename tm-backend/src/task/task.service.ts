import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { Prisma } from '../generated/prisma/client.js';
import { TaskQueryDTO } from './dto/task-query.dto.js';
import { WorkflowService } from '../workflow/workflow.service.js';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService, private readonly workflowService: WorkflowService) {}

  async findAll(user: AuthUser, query: TaskQueryDTO) {
      const page = query.page  ?? 1;
      const limit = query.limit ?? 10;
      const skip = (page - 1 ) * limit;

      const where: Prisma.TaskWhereInput = {
        OR: [
          {
            project: {
              OR: [
                { createdById: user.id },
                { members: { some: { userId: user.id } } },
              ],
            },
          },
          { taskAssignees: { some: { userId: user.id } } },
          { createdBy: { id: user.id } },
        ],
      };

      if(query.parentId !== undefined){
        where.parentId = query.parentId
      }else{
        where.parentId = null
      }

      if(query.projectId){
        where.projectId = query.projectId;
      }

      if(query.status){
        where.status = query.status
      }

      if(query.priority){
        where.priority = query.priority
      }

      if(query.dueDate){
        const start = new Date(query.dueDate);
        const nextDay = new Date(query.dueDate)

        start.setHours(0,0,0,0);
        nextDay.setDate(nextDay.getDate()+1)
        nextDay.setHours(0,0,0,0)

        where.dueDate ={
          gte: start,
          lt: nextDay
        }
      }

      if(query.search){
        where.title ={
          contains: query.search,
          mode: 'insensitive'
        }
      }

      const [tasks, total] = await Promise.all([
        this.prisma.task.findMany({
          where, skip, take: limit, orderBy:{
            [query.sortBy ?? "createdAt"]: query.sortOrder ?? "desc"
          },
          omit:{formulaId:true, projectId: true, createdById: true, parentId:true },
          include: {
            formula:{
              select:{
                id: true, name: true,
              }
            },
            project:{
              select:{
                id: true, name: true
              }
            },
            createdBy:{
              select:{id: true, email: true, name:true}
            },
            taskAssignees:{
              select:{
                user:{
                  select:{
                    id: true, email: true, name:true
                  }
                }
              }
            },
            parentTask:{
              select:{
                id: true, title:true,
              }
            },
            subTasks:{
              select:{
                id: true, title:true,
              },
              orderBy:{
                createdAt: 'asc'
              },
          }}
        }),
        this.prisma.task.count({where})
      ]) 

      return {
        tasks, total, page, limit, totalPages: Math.ceil(total/limit)
      }
  }

  async findOne(id: string, user: AuthUser) {
    const task = await this.prisma.task.findUnique({
      where:{
        id
      },
      omit:{formulaId:true, projectId: true, createdById: true, parentId:true },
      include: {
            formula:{
              select:{
                id: true, name: true,
              }
            },
            project:{
              select:{
                id: true, name: true, workspaceId: true, createdById: true, members: true,
              }
            },
            createdBy:{
              select:{id: true, email: true, name:true}
            },
            taskAssignees:{
              select:{
                user:{
                  select:{
                    id: true, email: true, name:true
                  }
                }
              }
            },
            parentTask:{
              select:{
                id: true, title:true,
              }
            },
            subTasks:{
              select:{
                id: true, title:true,
              },
              orderBy:{
                createdAt: 'asc'
              },
             
            }
          }
    })
    
    if(!task){
      throw new NotFoundException('Task not found');
    }

    //check permission to view
    const canView = task.project.createdById === user.id ||
        task.project.members.some(m => m.userId === user.id) ||
        task.taskAssignees.some(member => member.user.id === user.id) ||
        task.createdBy.id === user.id
      

    if(!canView){
      throw new ForbiddenException('You do not have permission to view this task')
    }
    return task
  }

  async createTask(dto: CreateTaskDto, user: AuthUser) {
    const project = await this.prisma.project.findFirst({
      where:{
        id: dto.projectId
      },
      include:{
        members:{
          select:{
            user:{
              select:{
                id: true, email: true, name: true
              }
            }
          }
        }
      }
    })

    if(!project){
      throw new NotFoundException('Project not found')
    }

    const isProjectMember = project.createdById === user.id || project.members.some(member => member.user.id === user.id)

    if(!isProjectMember){
      throw new ForbiddenException('You are not a member of this project')    
    }

    //check parent
    if(dto.parentId){
      const parentTask = await this.prisma.task.findFirst({
        where:{
          id: dto.parentId
        }
      })

      if(!parentTask){
        throw new NotFoundException('Parent task not found')
      }

      if(parentTask.projectId !== dto.projectId){
        throw new BadRequestException('Parent task belongs to a different project')      
      }

      if(parentTask.parentId){
        throw new BadRequestException('Task is already a sub task')
      }
    }

    if(dto.assigneeIds){
      const allowedUserIds = [project.createdById, ...project.members.map(m => m.user.id)];
      const isValid = dto.assigneeIds.every(id => allowedUserIds.includes(id));

      if (!isValid) {
        throw new BadRequestException('One or more assignees are not members of this project');
      }
    }

    const task = await this.prisma.task.create({
      data:{
        projectId: dto.projectId,
        createdById: user.id,
        title: dto.title.trim(),
        description: dto.description,
        priority: dto.priority,
        status: dto.status ?? 'TODO',
        dueDate: dto.dueDate,
        parentId: dto.parentId,
        customFields: dto.customFields as Prisma.InputJsonValue ?? Prisma.JsonNull,
        taskAssignees: dto.assigneeIds?.length ? {
          create: dto.assigneeIds.map(userId => ({ userId }))
        } : undefined
      }
    })

    return this.findOne(task.id, user);
  }

  async updateTask(id: string, dto: UpdateTaskDto, user: AuthUser) {
    const task = await this.prisma.task.findFirst({
      where:{
        id
      },
      include:{
        project:{
          select:{
            id: true, createdById: true, members:{
              select:{
                user:{select:{
                  id: true, email: true, name: true
                }}
              }
            }
          }
        },
        taskAssignees:true

      }
    })

    if(!task){
      throw new NotFoundException('Task not found');
    }

    const canUpdate = task.createdById === user.id ||
      task.project.createdById === user.id ||
      task.taskAssignees.some(assignee => assignee.userId === user.id)

    if(!canUpdate){
      throw new ForbiddenException('You do not have permission to update this task')
    }

    if(dto.parentId !== task.parentId){
      if(dto.parentId){
        const parentTask = await this.prisma.task.findFirst({
          where:{
            id: dto.parentId
          }
        })
        if(!parentTask){
          throw new NotFoundException('Parent task not found')
        }
        if(parentTask.projectId !== task.projectId){
          throw new BadRequestException('Parent task belongs to a different project')
        }
        if(parentTask.id === task.id){
          throw new BadRequestException('Task cannot be its own parent')
        }
        if(parentTask.parentId){
          throw new BadRequestException(`This task is already a subtask,`
           + `you cannot change it to a parent task`)
        } 
      }
    }

    if(dto.assigneeIds){
      const allowedUserIds = [task.project.createdById, ...task.project.members.map(m => m.user.id)]

      const isValid = dto.assigneeIds.every(id => allowedUserIds.includes(id))

      if(!isValid){
        throw new BadRequestException('One or more assignees are not members of this project')
      }

      await this.prisma.taskAssignee.deleteMany({
        where:{
          taskId: task.id
        }
      })

      if(dto.assigneeIds.length > 0){
        await this.prisma.taskAssignee.createMany({
          data: dto.assigneeIds.map(userId => ({
            taskId: task.id, 
            userId
          }))
        })
      }
    }

    //check workflow
    if(dto.status && dto.status !== task.status){
      await this.workflowService.assertValidTransition(
        task.projectId, 
        task.status, //status hien tai
        dto.status! //status cap nhat
      )
    }

    await this.prisma.task.update({
      where: { id: task.id },
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        status: dto.status,
        dueDate: dto.dueDate,
        parentId: dto.parentId,
        customFields: dto.customFields !== undefined
          ? (dto.customFields as Prisma.InputJsonValue ?? Prisma.JsonNull)
          : undefined,
      },
    });

    return this.findOne(task.id, user)
  }

  async deleteTask(id: string, user: AuthUser) {
    const task = await this.prisma.task.findFirst({
      where:{
        id
      },
      include:{
        project:{
          select:{
            createdById: true
          }
        }
      }
    })

    if(!task){
      throw new NotFoundException('Task not found')
    }

    const canDelete = task.createdById === user.id || task.project.createdById === user.id

    if(!canDelete){
      throw new ForbiddenException('You do not have permission to delete this task')
    }

    await this.prisma.task.delete({
      where:{
        id: task.id
      }
    })

    return true;
  }

  async findAllKeyResultsLinkedToTask(taskId: string, user: AuthUser){
    const task = await this.prisma.task.findUnique({
      where: {  
        id: taskId,
      },
    select: {
      id: true,
      title: true,
      status: true,
      

      project: {
        select: {
          name:true,
          createdById: true,
           members: {
            select: {
              userId: true,
            },
          },
        },
      },

      taskKeyResults: {
        select: {
           keyResult: {
              select: {
                 id: true,
                 title: true,
                 currentValue: true,
                 targetValue: true,
              unit: true,
              },
            },
          },
        },
      },
    });
    

    if(!task){
      throw new NotFoundException('Task not found');
    }

    const isProjectMember = task.project.createdById === user.id || 
                        task.project.members.some(member => member.userId === user.id);
    if(!isProjectMember){
      throw new ForbiddenException('You are not a member of this project');
    }

    const keyResultsLinkedToTask = await this.prisma.task.findUnique({
      where:{
        id: taskId
      },
      
    }) 

    if(!keyResultsLinkedToTask){
      throw new NotFoundException('Task not found')
    }

    return task
  }

    async LinkTaskToKeyResult (taskId: string, keyResultId: string, user: AuthUser){
      const task = await this.prisma.task.findUnique({
        where:{
          id: taskId
        },
        include:{
          project:{
            select:{
              createdById: true, 
              members:{
                select:{
                  userId: true
                }
              },
              workspaceId: true
            }
          }
        }
      })

      if(!task){
        throw new NotFoundException('Task not found')
      }

      const isProjectMember = task.project.createdById === user.id || task.project.members.some(member => member.userId === user.id)
      if(!isProjectMember){
        throw new ForbiddenException('You are not a member in this project')
      }

      const keyResult = await this.prisma.keyResult.findUnique({
        where:{
          id: keyResultId
        },
        include:{
          objective:{
            select:{
              workspaceId:true
            }
          }
        }
      })

      if(!keyResult){
        throw new NotFoundException('Key result not found')
      }

      const isSameWorkspace = keyResult.objective.workspaceId === task.project.workspaceId
      if(!isSameWorkspace){
        throw new ForbiddenException('You are not a member in this workspace')
      }

      return this.prisma.taskKeyResult.create({
        data:{
          taskId:task.id,
          keyResultId:keyResult.id
        }
      })
  }

  async UnLinkTaskToKeyResult(taskId: string, keyResultId: string, user: AuthUser) {
    const task = await this.prisma.task.findUnique({
        where: {
          id: taskId
        },
        include:{
          project:{
            select:{
              createdById: true, 
              members:{
                select:{
                  userId: true
                }
              },
              workspaceId: true
            }
          }
        }
      })

      if(!task){
        throw new NotFoundException('Task not found')
      }

      const isProjectMember = task.project.createdById === user.id || task.project.members.some(member => member.userId === user.id)
      if(!isProjectMember){
        throw new ForbiddenException('You are not a member in this project')
      }

      const keyResult = await this.prisma.keyResult.findUnique({
        where:{
          id: keyResultId
        },
        include:{
          objective:{
            select:{
              workspaceId:true
            }
          }
        }
      })

      if(!keyResult){
        throw new NotFoundException('Key result not found')
      }

      const isSameWorkspace = keyResult.objective.workspaceId === task.project.workspaceId
      if(!isSameWorkspace){
        throw new ForbiddenException('You are not a member in this workspace')
      }

    const taskKeyResult = await this.prisma.taskKeyResult.findUnique({
      where: {
        taskId_keyResultId: {taskId, keyResultId}
      }
    })

    if(!taskKeyResult){
      throw new NotFoundException('Task key result not found')
    }

    return this.prisma.taskKeyResult.delete({
      where: {
        taskId_keyResultId: {taskId, keyResultId}
      }
    })

  }
    
  async assertTaskPermission(taskId: string, userId: string) {
  const task = await this.prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { createdById: userId },                       // Người tạo task
        { project: { createdById: userId } },          // Chủ dự án
        { taskAssignees: { some: { userId } } },       // Người được giao task
      ],
    },
    select: { id: true, projectId: true },
  });

  if (!task) {
    throw new ForbiddenException('You do not have permission on this task');
  }

  return task;
}

}
