import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DistribucionPorAnoDto {
  @ApiPropertyOptional({ description: 'Departamento de residencia (ej: VALLE)', example: 'VALLE' })
  @IsOptional()
  @IsString()
  departamento?: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  @IsOptional()
  @IsIn(['M', 'F'])
  genero?: string;

  @ApiPropertyOptional({ enum: ['URBANO', 'RURAL'] })
  @IsOptional()
  @IsIn(['URBANO', 'RURAL'])
  zona?: string;

  @ApiPropertyOptional({ enum: ['OFICIAL', 'NO OFICIAL'] })
  @IsOptional()
  @IsIn(['OFICIAL', 'NO OFICIAL'])
  naturaleza?: string;

  @ApiPropertyOptional({ description: 'Año inicio del rango', example: 2014 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2014)
  @Max(2022)
  anoDesde?: number;

  @ApiPropertyOptional({ description: 'Año fin del rango', example: 2022 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2014)
  @Max(2022)
  anoHasta?: number;
}