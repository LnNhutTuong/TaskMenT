import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { RoleName } from '../generated/prisma/enums.js';

@Injectable()
export class TaskStatusService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string, user: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, members: { select: { memberId: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (
      user.role !== RoleName.ADMIN &&
      project.ownerId !== user.id &&
      !project.members.some((member) => member.memberId === user.id)
    ) {
      throw new ForbiddenException('You cannot access this project status');
    }

    return this.prisma.taskStatus.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createStatus(projectId: string, user: AuthUser, key: string, name?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, members: { select: { memberId: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (
      user.role !== RoleName.ADMIN &&
      project.ownerId !== user.id &&
      !project.members.some((member) => member.memberId === user.id)
    ) {
      throw new ForbiddenException('You cannot create a status for this project');
    }

    const normalizedKey = key.trim();
    if (!normalizedKey) {
      throw new BadRequestException('Status key is required');
    }

    const existing = await this.prisma.taskStatus.findFirst({
      where: { projectId, key: normalizedKey },
    });

    if (existing) {
      throw new BadRequestException('Status key already exists in this project');
    }

    return this.prisma.taskStatus.create({
      data: {
        projectId,
        key: normalizedKey,
        name: name?.trim() || normalizedKey,
        isDefault: false,
      },
    });
  }

  async updateStatus(projectId: string, statusId: string, user: AuthUser, payload: { key?: string; name?: string }) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, members: { select: { memberId: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (
      user.role !== RoleName.ADMIN &&
      project.ownerId !== user.id &&
      !project.members.some((member) => member.memberId === user.id)
    ) {
      throw new ForbiddenException('You cannot update this status');
    }

    const status = await this.prisma.taskStatus.findUnique({
      where: { id: statusId },
    });

    if (!status || status.projectId !== projectId) {
      throw new NotFoundException('Task status not found');
    }

    const nextKey = payload.key?.trim();
    const nextName = payload.name?.trim();

    if (nextKey && nextKey !== status.key) {
      const conflict = await this.prisma.taskStatus.findFirst({
        where: { projectId, key: nextKey },
      });

      if (conflict) {
        throw new BadRequestException('Status key already exists in this project');
      }
    }

    return this.prisma.taskStatus.update({
      where: { id: statusId },
      data: {
        ...(nextKey ? { key: nextKey } : {}),
        ...(nextName !== undefined ? { name: nextName || status.key } : {}),
      },
    });
  }

  async deleteStatus(projectId: string, statusId: string, user: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, members: { select: { memberId: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (
      user.role !== RoleName.ADMIN &&
      project.ownerId !== user.id &&
      !project.members.some((member) => member.memberId === user.id)
    ) {
      throw new ForbiddenException('You cannot delete this status');
    }

    const status = await this.prisma.taskStatus.findUnique({
      where: { id: statusId },
    });

    if (!status || status.projectId !== projectId) {
      throw new NotFoundException('Task status not found');
    }

    if (status.isDefault) {
      throw new BadRequestException('Default status cannot be deleted');
    }

    const tasksUsingStatus = await this.prisma.task.count({
      where: { statusId: status.id },
    });

    if (tasksUsingStatus > 0) {
      throw new BadRequestException(
        'Cannot delete status because it is assigned to tasks',
      );
    }

    await this.prisma.taskStatus.delete({
      where: { id: statusId },
    });

    return { id: statusId, deleted: true };
  }
}
