import { PartialType } from '@nestjs/mapped-types';
import {CreateObjectiveDto} from "./create-objective.dto.js"

export class UpdateObjectiveDto extends PartialType(CreateObjectiveDto) {}