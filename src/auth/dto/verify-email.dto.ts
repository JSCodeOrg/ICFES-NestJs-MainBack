import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'correo@dominio.com' })
  @IsEmail({}, { message: 'Correo inválido.' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos.' })
  code: string;
}