import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ComparacionDepartamentosDto {
  @ApiProperty({ description: 'Nombre del departamento A', example: 'VALLE' })
  @IsString()
  @IsNotEmpty()
  departamentoA: string;

  @ApiProperty({ description: 'Nombre del departamento B', example: 'ANTIOQUIA' })
  @IsString()
  @IsNotEmpty()
  departamentoB: string;
}
