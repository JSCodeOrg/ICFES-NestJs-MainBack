import { ApiProperty } from "@nestjs/swagger";
import { Departamento } from "./departamentoDto";
import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

export class TopMunicipiosDepartamento extends Departamento {
    @ApiProperty({ description: 'Cantidad deseada de municipios', example: 5 })
    @Type(() => Number)
    @IsNumber()
    limit: number
}