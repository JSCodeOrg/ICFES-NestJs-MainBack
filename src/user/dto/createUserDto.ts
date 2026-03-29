import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'correo@dominio.com', description: 'Correo electrónico del usuario.' })
  @IsEmail({}, { message: 'Debes ingresar una dirección de correo electrónico válida' })
  email: string;

  @ApiProperty({ example: 'contraseña123', description: 'Contraseña de mínimo 8 carácteres de longitud.' })
  @IsString()
  @MinLength(8, { message: 'Asegúrate de que tu contraseña tenga 8 carácteres mínimo.' })
  password: string;

  @ApiProperty({ example: 'Manuel Pepito', description: 'Nombre del usuario.' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  firstname: string;

  @ApiProperty({ example: 'Perez Perez', description: 'Apellido del usuario.' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  lastname: string;

  @ApiProperty({ example: 'consultor', description: 'Rol del usuario, por defecto es "user".' })
  @IsString()
  @IsNotEmpty({ message: 'El rol es obligatorio.' })
  role: string;
}
