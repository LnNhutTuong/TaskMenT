import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClassificationRuleService } from './classification-rule.service.js';
import { CreateClassificationRuleDto } from './dto/create-classification-rule.dto.js';
import { UpdateClassificationRuleDto } from './dto/update-classification-rule.dto.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { RequirePermission } from '../permission/decorations/permission.decoration.js';
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';


@Controller('classification-rule')
export class ClassificationRuleController {
  constructor(private readonly classificationRuleService: ClassificationRuleService) {}

  @RequirePermission(PERMISSION_KEYS.CLASSIFICATION_MANAGE)
  @Post('create')
  create(@Body() dto: CreateClassificationRuleDto, @CurrentUser() user: AuthUser) {
    const classificationRule =  this.classificationRuleService.create(dto, user);
    return{
      message: 'create classification rule success',
      data: classificationRule
    }
  }

  @Get('workspace/:workspaceId')
  async findAll(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthUser) {
    return{
      message: 'get classification rule success',
      data:  await this.classificationRuleService.findByWorkspace(workspaceId, user)
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateClassificationRuleDto, @CurrentUser() user: AuthUser) {
    const classificationRule = await this.classificationRuleService.update(id, dto, user);
    return{
      message: 'update classification rule success',
      data: classificationRule
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.classificationRuleService.remove(id, user);
    return{
      message: 'delete classification rule success',
    }
  }

}
