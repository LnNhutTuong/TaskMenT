import { PartialType } from "@nestjs/mapped-types";
import { CreateCriteriaDto } from "./create-criteria-.dto.js";

export class UpdateCriteriaDTO extends PartialType(CreateCriteriaDto){
    
}