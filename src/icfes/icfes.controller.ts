import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IcfesService } from './icfes.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PromedioAnualDto } from './dto/promedioAnualDto';
import { RolesGuard } from 'src/auth/roles.guard';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('icfes')
export class IcfesController {
  constructor(private readonly icfesService: IcfesService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('promedio-anual')
  @ApiOperation({
    summary: 'Promedio anual del examen por año',
    description: 'Devuelve el promedio del año al recibir el año',
  })
  @ApiResponse({ status: 200, description: 'Promedio del año seleccionado' })
  @ApiResponse({ status: 400, description: 'El año solicitado no está contenido dentro del intérvalo 2014-2022' })
  promedioAnual(@Query() dto: PromedioAnualDto) {
    return this.icfesService.promedioAnual(dto);
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('promedio-nacional')
  @ApiOperation({
    summary: 'Promedio nacional del puntaje global',
    description: 'Devuelve el promedio global de todos los registros',
  })
  @ApiResponse({ status: 200, description: 'Promedio nacional calculado correctamente' })
  @ApiResponse({ status: 500, description: 'Error al calcular el promedio nacional' })
  promedioNacional() {
    return this.icfesService.promedioNacional();
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('total-registros')
  @ApiOperation({
    summary: 'Total de registros',
    description: 'Devuelve el total de registros en la base de datos',
  })
  @ApiResponse({ status: 200, description: 'Total de registros obtenido correctamente' })
  @ApiResponse({ status: 500, description: 'Error al contar los registros' })
  totalRegistros() {
    return this.icfesService.totalRegistros();
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('comparacion-colegios')
  @ApiOperation({
    summary: 'Comparación entre colegios oficiales y no oficiales',
    description: 'Devuelve promedio y total de estudiantes agrupados por tipo de colegio',
  })
  @ApiResponse({ status: 200, description: 'Comparación realizada correctamente' })
  @ApiResponse({ status: 500, description: 'Error al realizar la comparación' })
  comparacionColegios() {
    return this.icfesService.comparacionColegios();
  }
}
