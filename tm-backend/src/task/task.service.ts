import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { RoleName } from '../generated/prisma/enums.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { Prisma } from '../generated/prisma/client.js';
import { TaskQueryDTO } from './dto/task-query.dto.js';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: AuthUser, query: TaskQueryDTO) {
    // where
    const where: Prisma.TaskWhereInput = {};

    if (user.role === RoleName.USER) {
      where.project = {
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                memberId: user.id,
              },
            },
          },
        ],
      };
    }

    if (query.status) {
      where.status = {
        key: query.status,
      };
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.deadline) {
      const start = new Date(query.deadline);
      const nextDay = new Date(query.deadline);

      start.setHours(0, 0, 0, 0);

      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      where.deadline = {
        gte: start,
        lt: nextDay,
      };
    }

    if (query.search) {
      where.title = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    // paginate
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    // sort
    let sort: object;

    if (query.sortBy === 'deadline') {
      sort = {
        deadline: {
          sort: query.sortOrder,
          nulls: 'last',
        },
      };
    } else {
      sort = { [query.sortBy]: query.sortOrder };
    }

    const [tasks, totalTask] = await Promise.all([
      this.prisma.task.findMany({ where, skip, take, orderBy: sort }),
      this.prisma.task.count({ where }),
    ]);

    const totalPage = Math.ceil(totalTask / query.limit);
    return {
      tasks,
      totalPage,
      totalTask,
      page: query.page,
    };
  }

  async findOne(id: string, user: AuthUser) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const project = await this.prisma.project.findFirst({
      where: {
        id: task.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Admin la cha
    if (user.role === RoleName.ADMIN) {
      return task;
    }

    const isOwner = project.ownerId === user.id;

    const isMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId: project.id,
        memberId: user.id,
      },
    });

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You cannot view this task');
    }

    return task;
  }

  async createTask(dto: CreateTaskDto, user: AuthUser) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: dto.projectId,
        ownerId: user.id,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const members = await this.prisma.projectMember.findMany({
      where: {
        projectId: dto.projectId,
      },
      select: {
        memberId: true,
      },
    });

    const allowedUserIds = [
      project.ownerId,
      ...members.map((member) => member.memberId),
    ];

    const isValidMember =
      dto.assigneeIds?.every((assigneeId) =>
        allowedUserIds.includes(assigneeId),
      ) ?? true;

    if (!isValidMember) {
      throw new BadRequestException(
        'Assignee is not a member or owner of this project',
      );
    }

    const status = await this.prisma.taskStatus.findFirst({
      where: {
        projectId: dto.projectId,
        key: dto.status,
      },
    });

    if (!status) {
      throw new NotFoundException('Task status not found');
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        statusId: status.id,
        deadline: dto.deadline,
        priority: dto.priority,
        projectId: dto.projectId,
        assigned: {
          create: dto.assigneeIds?.map((userId) => ({
            assignId: userId,
          })),
        },
      },
    });
  }

  async updateTask(id: string, dto: UpdateTaskDto, user: AuthUser) {
    //find task to update
    const task = await this.prisma.task.findFirst({
      where: {
        id,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.isClosed) {
      throw new BadRequestException(
        'Cannot update this task because is closed',
      );
    }

    //find project which task on in
    const project = await this.prisma.project.findFirst({
      where: {
        id: task.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    //tim nhung thanh vien cua project
    const members = await this.prisma.projectMember.findMany({
      where: {
        projectId: task.projectId,
      },
      select: {
        memberId: true,
      },
    });

    //check cai thang thuc hien cai action
    const isAssignee = await this.prisma.assignedTask.findFirst({
      where: {
        taskId: task.id,
        assignId: user.id,
      },
    });

    const isOwner = project.ownerId === user.id;

    if (!isOwner && !isAssignee) {
      throw new ForbiddenException('You cannot update this task');
    }

    //status

    //bien tam
    let statusId: string | undefined;

    //neu co truyen thang status thi moi vao case
    if (dto.status) {
      //find status in project
      const status = await this.prisma.taskStatus.findFirst({
        where: {
          projectId: task.projectId,
          key: dto.status,
        },
      });

      statusId = status?.id;
      if (!status) {
        throw new NotFoundException('Task status not found');
      }
    }

    //kiem tra cac thang se duoc assign vao,
    const allowedUserIds = [
      project.ownerId,
      ...members.map((member) => member.memberId),
    ];

    const isValidMember =
      dto.assigneeIds?.every((assigneeId) =>
        allowedUserIds.includes(assigneeId),
      ) ?? true;

    if (!isValidMember) {
      throw new BadRequestException(
        'Assignee is not a member or owner of this project',
      );
    }

    await this.prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        priority: dto.priority,
        ...(statusId ? { statusId: statusId } : {}),
        deadline: dto.deadline,
      },
    });

    if (dto.assigneeIds !== undefined) {
      await this.prisma.assignedTask.deleteMany({
        where: {
          taskId: task.id,
        },
      });
      await this.prisma.assignedTask.createMany({
        data: dto.assigneeIds.map((assigneeId) => ({
          assignId: assigneeId,
          taskId: task.id,
        })),
      });
    }

    //task after update
    return this.prisma.task.findUnique({
      where: {
        id: task.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        deadline: true,
        priority: true,
        isClosed: true,
        createdAt: true,
        updatedAt: true,

        status: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },

        assigned: {
          select: {
            assigned: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            },
          },
        },

        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async closeTask(id: string, user: AuthUser) {
    //find task to update
    const task = await this.prisma.task.findFirst({
      where: {
        id,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.isClosed) {
      throw new BadRequestException('Task is already closed');
    }

    //find project which task on in
    const project = await this.prisma.project.findFirst({
      where: {
        id: task.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const taskStatus = await this.prisma.taskStatus.findFirst({
      where: {
        projectId: project.id,
        key: 'DONE',
      },
    });

    if (!taskStatus) {
      throw new NotFoundException('Status task not found');
    }

    const isOwner = project.ownerId === user.id;

    //check member is assignee or not
    const isAssignee = await this.prisma.assignedTask.findFirst({
      where: {
        taskId: task.id,
        assignId: user.id,
      },
    });

    if (!isOwner && !isAssignee) {
      throw new ForbiddenException('You cannot close this task');
    }

    return this.prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        isClosed: true,
        statusId: taskStatus.id,
        previousStatusId: task.statusId,
      },
    });
  }

  async reOpenTask(id: string, user: AuthUser) {
    //find task to update
    const task = await this.prisma.task.findFirst({
      where: {
        id,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.isClosed) {
      throw new BadRequestException('Task is already open');
    }

    //find project which task on in
    const project = await this.prisma.project.findFirst({
      where: {
        id: task.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!task.previousStatusId) {
      throw new BadRequestException('Task has no previous task');
    }

    const isOwner = project.ownerId === user.id;

    //check member is assignee or not
    const isAssignee = await this.prisma.assignedTask.findFirst({
      where: {
        taskId: task.id,
        assignId: user.id,
      },
    });

    if (!isOwner && !isAssignee) {
      throw new ForbiddenException('You cannot reopen this task');
    }

    return this.prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        isClosed: false,
        statusId: task.previousStatusId,
      },
    });
  }

  async deleteTask(id: string, user: AuthUser) {
    //find task to update
    const task = await this.prisma.task.findFirst({
      where: {
        id,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    //find project which task on in
    const project = await this.prisma.project.findFirst({
      where: {
        id: task.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isOwner = project.ownerId === user.id;

    //check member is assignee or not
    const isAssignee = await this.prisma.assignedTask.findFirst({
      where: {
        taskId: task.id,
        assignId: user.id,
      },
    });

    if (!isOwner && !isAssignee) {
      throw new ForbiddenException('You cannot delete this task');
    }

    return this.prisma.task.delete({
      where: {
        id: task.id,
      },
    });
  }
}
