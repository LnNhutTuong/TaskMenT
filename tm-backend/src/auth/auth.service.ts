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
    const existedEmail = await this.prisma.user.findUnique({
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
        name: dto.name.trim(),
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
      include: {
        systemRoles: {
          include: {
            role: true,
          },
        },

        workspaceMemberships: {
          where:{
            workspace:{
              deletedAt: null
            }
          },
          include: {
            role: {select:{
                name: true
              }},
            workspace: {
              select:{
                id: true,
                name: true
              }
            },
          },
          
        },
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

    const systemRoles = user.systemRoles.map(
      (ur) => ur.role.name,
    );

    const workspaceRoles = user.workspaceMemberships.map(
      (member) => ({
        id: member.workspace.id,
        workspaceName: member.workspace.name,
        role: member.role.name,
      }),
    );

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        email: dto.email,
        name: user.name,
        roles:{
          system: systemRoles,
          workspace: workspaceRoles
        }
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
