import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDTO } from './dto/register.dto.js';
import { LoginDTO } from './dto/login.dto.js';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@ApiTags('AUTH')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(`register`)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new account with email and password',
  })
  @ApiBody({ type: RegisterDTO })
  @ApiResponse({
    status: 201,
    description: 'Register successfully',
    schema: {
      example: {
        message: 'Register successfully',
        data: {
          id: 1,
          email: 'user@example.com',
          name: 'Nguyen Van A',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid registration data' })
  @ApiConflictResponse({ description: 'Email already exists' })
  async register(@Body() dto: RegisterDTO) {
    let user = await this.authService.register(dto);

    return {
      message: 'Register successfully',
      data: user,
    };
  }

  @Post(`login`)
  @ApiOperation({
    summary: 'Log in',
    description: 'Authenticate a user and return an access token',
  })
  @ApiBody({ type: LoginDTO })
  @ApiResponse({
    status: 201,
    description: 'Login successfully',
    schema: {
      example: {
        message: 'Login successfully',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid login data' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(@Body() dto: LoginDTO) {
    let user = await this.authService.login(dto);

    return {
      message: 'Login successfully',
      data: user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  async me(@Req() req: Request) {
    return req.user;
  }
}
