import { Controller, Get } from '@nestjs/common';
import { IcfesService } from './icfes.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('icfes')
export class IcfesController {
  constructor(private readonly icfesService: IcfesService) {}

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
}
