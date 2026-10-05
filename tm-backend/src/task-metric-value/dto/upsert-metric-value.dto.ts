import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class UpsertMetricValueDTO {

    @IsString()
    @IsNotEmpty()
    taskId: string;

    @IsString()
    @IsNotEmpty()
    metricId: string;

    @IsNumber()
    @IsNotEmpty()
    value: number;
}
