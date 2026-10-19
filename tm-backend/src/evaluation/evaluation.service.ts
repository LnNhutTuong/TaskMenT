import { Injectable } from '@nestjs/common';
import { CreateEvaluationDto } from './dto/create-evaluation.dto.js';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto.js';

@Injectable()
export class EvaluationService {
  create(createEvaluationDto: CreateEvaluationDto) {
    return 'This action adds a new evaluation';
  }

  findAll() {
    return `This action returns all evaluation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} evaluation`;
  }

  update(id: number, updateEvaluationDto: UpdateEvaluationDto) {
    return `This action updates a #${id} evaluation`;
  }

  remove(id: number) {
    return `This action removes a #${id} evaluation`;
  }
}
