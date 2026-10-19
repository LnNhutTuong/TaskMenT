import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateKeyResultDto } from './create-key-result.dto.js';

export class UpdateKeyResultDto extends OmitType(PartialType(CreateKeyResultDto), ['objectiveId']) {
    
}
