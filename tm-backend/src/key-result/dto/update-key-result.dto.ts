import { PartialType } from '@nestjs/mapped-types';
import { CreateKeyResultDto } from './create-key-result.dto.js';
import { OmitType } from '@nestjs/swagger';

export class UpdateKeyResultDto extends OmitType(PartialType(CreateKeyResultDto), ['objectiveId']) {
    
}
