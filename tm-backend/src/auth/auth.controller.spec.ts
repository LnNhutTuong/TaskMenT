import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { AuthModuleOptions } from '@nestjs/passport';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: vi.fn(),
    login: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
        { provide: AuthModuleOptions, useValue: {} },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('registers a user through AuthService', async () => {
    const dto = {
      email: 'user@example.com',
      password: 'password123',
      name: 'Test User',
    };
    const user = { id: 1, email: dto.email, name: dto.name };
    authService.register.mockResolvedValue(user);

    await expect(controller.register(dto)).resolves.toEqual({
      message: 'Register successfully',
      data: user,
    });
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('logs in through AuthService', async () => {
    const dto = {
      email: 'user@example.com',
      password: 'password123',
    };
    const loginResult = {
      accessToken: 'access-token',
      email: dto.email,
    };
    authService.login.mockResolvedValue(loginResult);

    await expect(controller.login(dto)).resolves.toEqual({
      message: 'Login successfully',
      data: loginResult,
    });
    expect(authService.login).toHaveBeenCalledWith(dto);
  });
});
