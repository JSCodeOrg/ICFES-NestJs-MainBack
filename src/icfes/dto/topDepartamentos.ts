import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

export class TopDepartamentos {
    @ApiProperty({ description: 'Cantidad deseada de departamentos', example: 5 })
    @Type(() => Number)
    @IsNumber()
    limit: number;
}
