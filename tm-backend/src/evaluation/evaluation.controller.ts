import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EvaluationService } from './evaluation.service.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { GenearateEvaluationDto } from './dto/generate-evaluation.dto.js';
import { ReviewEvaluationDto } from './dto/review-evaluation.dto.js';
import { SelfEvaluationDto } from './dto/self-evaluation.dto.js';

@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

}
