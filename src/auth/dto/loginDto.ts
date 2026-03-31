import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, IsString } from "class-validator"

export class LoginDto {

    @ApiProperty({example: 'correo@dominio.com', description: 'Correo electrónico del usuario'})
    @IsEmail({}, {message: 'Debes ingresar una dirección de correo electrónico válida.'})
    @IsNotEmpty()
    email: string;

    @ApiProperty({example: 'contraseña123', description: 'Contraseña segura del usuario.'})
    @IsString()
    @IsNotEmpty()
    password: string
}