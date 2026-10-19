import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDTO } from './dto/register.dto.js';
import { LoginDTO } from './dto/login.dto.js';
import type { Request } from 'express';
import { Public } from '../permission/decorations/public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(`register`)
  @Public()
  async register(@Body() dto: RegisterDTO) {
    let user = await this.authService.register(dto);

    return {
      message: 'Register successfully',
      data: user,
    };
  }

  @Post(`login`)
  @Public()
  async login(@Body() dto: LoginDTO) {
    let user = await this.authService.login(dto);

    return {
      message: 'Login successfully',
      data: user,
    };
  }

  @Get('me')
  async me(@Req() req: Request) {
    return req.user;
  }
}
