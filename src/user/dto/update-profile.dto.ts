import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class UpdateProfileDto {
    @ApiProperty({ example: 'Jairo', description: 'Nombre del usuario.'})
    @IsString()
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres'})
    firstname: string;

    @ApiProperty({ example: 'Gomez', description: 'Apellido del usuario.' })
    @IsString()
    @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres.' })
    lastname: string;
}