import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateTaskDto } from "./create-task.dto.js";

export class UpdateTaskDto extends PartialType(OmitType(CreateTaskDto, ['projectId'] as const)) {
}
