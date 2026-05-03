import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";


export class Departamento {
    @ApiProperty({ description: 'Nombre del departamento', example: 'VALLE' })
    @IsString()
    @IsNotEmpty()
    departamento: string;
}
