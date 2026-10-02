import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { KeyResultService } from './key-result.service.js';
import { CreateKeyResultDto } from './dto/create-key-result.dto.js';
import { UpdateKeyResultDto } from './dto/update-key-result.dto.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UseGuards } from '@nestjs/common';
import { UpdateKeyResultProgressDto } from './dto/update-key-result-progress.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('key-result')
export class KeyResultController {
  constructor(private readonly keyResultService: KeyResultService) {}


  @Get()
  async findAllByObjective(@CurrentUser() user: AuthUser, @Query('objId') objId: string ) {
    const keyResult = await this.keyResultService.findAllByObjective(objId, user);
    return {
      message: 'Get all key result by objective successfully',
      data: keyResult,
    };

  }

  @Get(':id')
  async findOne(@Param('id') id: string,@CurrentUser() user: AuthUser) {
    const keyResult = await this.keyResultService.findOne(id, user)
    return {
      message: 'Get key result successfully',
      data: keyResult,
    }
  }
  
  @Post('create')
  async create(@Body() dto: CreateKeyResultDto, @CurrentUser() user: AuthUser) {
    const keyResult = await this.keyResultService.create(dto, user)
    return {
      message: 'Create key result successfully',
      data: keyResult,
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateKeyResultDto, @CurrentUser() user: AuthUser) {
    const keyResult = await this.keyResultService.update(id, dto, user)
    return {
      message: 'Update key result successfully',
      data: keyResult,
    }
  }

  @Patch(':id/progress')
  async updateProgress(@Param('id') id: string, @Body() dto:UpdateKeyResultProgressDto, @CurrentUser() user: AuthUser){
    const keyResult = await this.keyResultService.updateProgress(id, dto, user);
    return {
      message: 'Update key result progress successfully',
      data: keyResult,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const keyResult = await this.keyResultService.remove(id, user)
    return {
      message: 'Delete key result successfully',
      data: keyResult,
    }
  }
}
