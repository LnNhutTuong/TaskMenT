import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { FormulaService } from './formula.service.js';
import { CreateFormulaDto } from './dto/create-formula.dto.js';
import { UpdateFormulaDto } from './dto/update-formula.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import { RequirePermission } from '../permission/decorations/permission.decoration.js';
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';

@UseGuards(JwtAuthGuard)
@Controller('formula')
export class FormulaController {
  constructor(private readonly formulaService: FormulaService) {}

  @RequirePermission(PERMISSION_KEYS.FORMULA_CREATE)
  @Post('create')
  async create(@Body() dto:CreateFormulaDto, @CurrentUser() user:AuthUser){
    const formula = await this.formulaService.create(dto, user)
    return{
      message: 'Create new formula successfully',
      data: formula
    }
  }

  @Get('workspace/:workspaceId')
  async findByWorkspaceId(@Param('workspaceId') workspaceId:string, @CurrentUser() user:AuthUser){
    const formula = await this.formulaService.findByWorkspace(workspaceId, user)
    return{
      message: 'Get formula by workspace successfully',
      data: formula
    }
  }
  
  @Patch(':id')
  async update(@Param('id') id:string, @Body() dto:UpdateFormulaDto, @CurrentUser() user:AuthUser){
    const formula = await this.formulaService.update(id, dto, user)
    return{
      message: 'Update formula successfully',
      data: formula
    }
  }

  @Delete(':id')
  async delete(@Param('id') id:string, @CurrentUser() user:AuthUser){
    const formula = await this.formulaService.remove(id, user)
    return{
      message: 'Delete formula successfully',
      data: formula
    }
  }

  @Post(':formulaId/assign-task/:taskId')
  async assignToTask(
    @Param('formulaId') formulaId:string,
    @Param('taskId') taskId:string,
    @CurrentUser() user:AuthUser
  ){
     const taskAfterAssign = await this.formulaService.assignToTask(formulaId, taskId, user);

     return{
      message: 'Assign task to formula successfully',
      data: taskAfterAssign
     }
  }

}
