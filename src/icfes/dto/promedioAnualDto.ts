import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class PromedioAnualDto {
    @ApiProperty({ description: 'Año de solicitud de promedio', example: '2018' })
    @Type(() => Number)
    @IsNumber()
    ano: number;
}