import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller.js';
import { TaskService } from './task.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AuthModuleOptions } from '@nestjs/passport';
import { PriorityLevel } from '../generated/prisma/enums.js';

const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

describe('TaskController', () => {
  let controller: TaskController;
  const taskService = {
    createTask: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        { provide: TaskService, useValue: taskService },
        { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
        { provide: AuthModuleOptions, useValue: {} },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
  });

  it('creates a task through TaskService', async () => {
    const dto = {
      title: 'Test task',
      status: TASK_STATUS.TODO,
      priority: PriorityLevel.MEDIUM,
      projectId: 'project-id',
    };
    const user = {
      id: 'user-id',
      email: 'user@example.com',
      name: 'Test User',
      role: RoleName.USER,
    };
    const createdTask = { id: 'task-id', ...dto, userId: user.id };
    taskService.createTask.mockResolvedValue(createdTask);

    await expect(controller.createTask(dto, user)).resolves.toEqual({
      message: 'Create new task successfully',
      data: createdTask,
    });
    expect(taskService.createTask).toHaveBeenCalledWith(dto, user);
  });
});
