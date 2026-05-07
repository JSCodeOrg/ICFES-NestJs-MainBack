import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PromedioDepartamentoDto {
  @ApiProperty({ description: 'Nombre del departamento', example: 'VALLE' })
  @IsString()
  @IsNotEmpty()
  departamento: string;
}