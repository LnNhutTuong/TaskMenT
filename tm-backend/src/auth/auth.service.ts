import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from '../common/password/password.service.js';
import { RegisterDTO } from './dto/register.dto.js';
import { LoginDTO } from './dto/login.dto.js';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from './types/jwt-payload.type.js';
import type { LoginResponse } from './types/jwt-payload.type.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private passService: PasswordService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDTO) {
    let existedEmail = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existedEmail) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.passService.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async login(dto: LoginDTO): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const comparePass = await this.passService.comparePassword(
      dto.password,
      user.password,
    );

    if (!comparePass) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        email: dto.email,
        name: user.name,
      },
    };
  }

  // async getProfile(dto: ProfileDTO) {
  //   const user = this.prisma.user.findUnique({
  //     where: {
  //       email: dto.email,
  //     },
  //   });

  //   if (!user) {
  //     throw new UnauthorizedException('Invalid email or password');
  //   }

  //   return {
  //     email: dto.email,
  //     name: dto.name,
  //   };
  // }
}
