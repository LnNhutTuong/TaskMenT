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

    const task = await this.prisma.task.findFirst({
      where: {
        id,
        ...where,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
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

    const members = await this.prisma.projectMember.findMany({
      where: {
        projectId: task.projectId,
      },
      select: {
        memberId: true,
      },
    });

    const isAssignee = await this.prisma.assignedTask.findFirst({
      where: {
        taskId: task.id,
        assignId: user.id,
      },
    });

    if (user.role === RoleName.ADMIN) {
      throw new ForbiddenException('Admin cannot update tasks');
    }

    const isOwner = project.ownerId === user.id;

    if (!isOwner && !isAssignee) {
      throw new ForbiddenException('You cannot update this task');
    }

    let statusId: string | undefined;

    if (dto.status) {
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
  }

  async deleteTask(id: string, user: AuthUser) {
    const where: Prisma.TaskWhereInput = {};

    if (user.role === RoleName.USER) {
      where.userId = user.id;
    }

    const task = await this.prisma.task.findFirst({
      where: {
        id,
        ...where,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.task.delete({
      where: {
        id,
      },
    });
  }
}
