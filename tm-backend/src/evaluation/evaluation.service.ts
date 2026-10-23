import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { GenearateEvaluationDto } from './dto/generate-evaluation.dto.js';
import { ReviewEvaluationDto } from './dto/review-evaluation.dto.js';
import { SelfEvaluationDto } from './dto/self-evaluation.dto.js';

@Injectable()
export class EvaluationService {
  constructor(private readonly prisma: PrismaService) {}
  
}
