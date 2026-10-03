import { IsEnum, IsNotEmpty, IsString, IsOptional } from "class-validator";
import { EvidenceStatus } from "../../generated/prisma/enums.js";

export class ReviewEvidenceDto {

    @IsEnum(EvidenceStatus)
    @IsNotEmpty()
    status: EvidenceStatus; // ACCEPTED hoặc REJECTED (không cho phép set lại PENDING)

    @IsString()
    @IsOptional()
    reviewNote?: string;    // Lý do duyệt hoặc lý do từ chối
}
