import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ObjectiveService } from './objective.service.js';
import { CreateObjectiveDto } from './dto/create-objective.dto.js';
import { UpdateObjectiveDto } from './dto/update-objective.dto.js';
import { ObjectiveQueryDto } from './dto/objective-query.dto.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('objective')
export class ObjectiveController {
  constructor(private readonly objectiveService: ObjectiveService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthUser, @Query() query:ObjectiveQueryDto) {
    let objectives = await this.objectiveService.findAll(user, query);

    return {
      message: 'Get all objectives successfully',
      data: objectives,
    };
    }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user:AuthUser) {
    const objective = await this.objectiveService.findOne(id, user)
    return{
      message: 'Get objective successfully',
      data: objective,
    }
    
  }

  @Post('create')
   async create(@Body() createObjectiveDto: CreateObjectiveDto, @CurrentUser() user:AuthUser) {
    const objective = await this.objectiveService.create(createObjectiveDto, user);
    return{
      message: 'Create objective successfully',
      data: objective,
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateObjectiveDto: UpdateObjectiveDto, @CurrentUser() user: AuthUser) {
    const objective = await this.objectiveService.update(id, updateObjectiveDto, user);
    return{
      message: 'Update objective successfully',
      data: objective,
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const objective = await this.objectiveService.remove(id, user);
    return {
      message: 'Delete objective successfully',
      data: objective,
    }
  }
}
