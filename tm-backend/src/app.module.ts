import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TaskModule } from './task/task.module.js';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PasswordModule } from './common/password/password.module.js';
import { ProjectModule } from './project/project.module.js';
import { TaskStatusModule } from './task-status/task-status.module.js';

@Module({
  imports: [
    PrismaModule,
    TaskModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    AuthModule,
    PasswordModule,
    ProjectModule,
    TaskStatusModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
