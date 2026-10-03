import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { EvidenceService } from './evidence.service.js';
import { SubmitEvidenceDto } from './dto/submit-evidence.dto.js';
import { ReviewEvidenceDto } from './dto/review-evidence.dto.js';
import { CurrentUser } from '../auth/decorations/current-user.decorator.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
@UseGuards(JwtAuthGuard)
@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post()
  async submit(@Body() dto: SubmitEvidenceDto, @CurrentUser() user:AuthUser){
    const evidence = await this.evidenceService.submit(dto, user)
    return{
      message: 'Submit evidence successfully',
      data: evidence
    }
  }

  @Patch(':id/review')
  async review(@Param('id') id: string, @Body() dto: ReviewEvidenceDto, @CurrentUser() user: AuthUser){
    const evidence = await this.evidenceService.review(id, dto, user);
    return{
      message: 'Review evidence successfully',
      data: evidence
    }
  }

  @Get('output/:outputId')
  async findByTaskoutput(@Param('outputId') outputId: string, @CurrentUser() user: AuthUser){
    const evidence = await this.evidenceService.findByTaskOutput(outputId, user)
    return{
      message: 'Get all evidence with output successfully',
      data: evidence
    }
  }
  
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser){
    const evidence = await this.evidenceService.remove(id, user)
    return{
      message: 'Delete evidence successfully',
      data: evidence
    }
  }
}
