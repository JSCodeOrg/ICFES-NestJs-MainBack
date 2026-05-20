import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class UpdatePasswordDto {
    @ApiProperty({ example: 'contraseñaactual123', description: 'Contraseña actual del usuario.'})
    @IsString()
    currentPassword: string;

    @ApiProperty({ example: 'contraseñanueva123', description: 'Nueva contraseña del usuario'})
    @IsString()
    @MinLength(8, {message: 'La nueva contraseña debe tener al menos 8 caracteres'})
    newPassword: string;
}