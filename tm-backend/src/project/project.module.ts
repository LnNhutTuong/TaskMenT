import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ProjectService } from './project.service.js';
import { ProjectController } from './project.controller.js';
import { PermissionModule } from '../permission/permission.module.js';

@Module({
  imports: [PrismaModule, AuthModule, PermissionModule],
  providers: [ProjectService],
  controllers: [ProjectController],
  exports: [ProjectService]
})
export class ProjectModule {}
