import { Controller, Get, Param, Query } from '@nestjs/common';
import { IcfesService } from './icfes.service';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PromedioAnualDto } from './dto/promedioAnualDto';

@Controller('icfes')
export class IcfesController {
  constructor(private readonly icfesService: IcfesService) { }

  @Get('distribucion-genero')
  @ApiOperation({
    summary: 'Distribución por género del exámen',
    description: 'Devuelve el conteo y porcentaje de estudiantes agrupados por género',
  })
  @ApiResponse({ status: 200, description: 'Conteo por género y porcentaje' })
  @ApiResponse({ status: 500, description: 'Ocurrió un error al calcular la distribución por género' })
  distribucionGenero() {
    return this.icfesService.distribucionGenero();
  }

  @Get('promedio-anual')
  @ApiOperation({
    summary: 'Promedio anual del examen por año',
    description: 'Devuelve el promedio del año al recibir el año'
  })
  @ApiResponse({status: 200, description: 'Promedio del año seleccionado'})
  @ApiResponse({status: 400, description: 'El año solicitado no está contenido dentro del intérvalo 2014-2022'})
  promedioAnual(@Query() dto: PromedioAnualDto) {
    return this.icfesService.promedioAnual(dto);
  }
}
