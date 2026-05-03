import { Controller, Get, Query } from '@nestjs/common';
import { IcfesService } from './icfes.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PromedioAnualDto } from './dto/promedioAnualDto';
import { CacheService } from '../cache/cache.service';
import { TopDepartamentos } from './dto/topDepartamentos';

@Controller('icfes')
export class IcfesController {
  constructor(private readonly icfesService: IcfesService, private readonly cacheService: CacheService) { }

  @Get('distribucion-genero')
  @ApiOperation({
    summary: 'Distribución por género del exámen',
    description: 'Devuelve la distribución por género del examen agrupados anualmente. ',
  })
  @ApiResponse({ status: 200, description: 'Conteo por género y porcentaje' })
  @ApiResponse({ status: 500, description: 'Ocurrió un error al calcular la distribución por género' })
  distribucionGenero() {
    return this.cacheService.remember(
      'distribucion_genero',
      {},
      () => this.icfesService.distribucionGeneroPorAnio()
    );
  }

  @Get('promedio-anual')
  @ApiOperation({
    summary: 'Promedio anual del examen por año',
    description: 'Devuelve el promedio del año al recibir el año',
  })
  @ApiResponse({ status: 200, description: 'Promedio del año seleccionado' })
  @ApiResponse({ status: 400, description: 'El año solicitado no está contenido dentro del intérvalo 2014-2022' })
  promedioAnual(@Query() dto: PromedioAnualDto) {
    return this.cacheService.remember(
      'promedio_anual',
      dto,
      () => this.icfesService.promedioAnual(dto)
    );
  }

  @Get('promedio-nacional')
  @ApiOperation({
    summary: 'Promedio nacional del puntaje global',
    description: 'Devuelve el promedio global de todos los registros',
  })
  @ApiResponse({ status: 200, description: 'Promedio nacional calculado correctamente' })
  @ApiResponse({ status: 500, description: 'Error al calcular el promedio nacional' })
  promedioNacional() {
    return this.cacheService.remember(
      'promedio_nacional',
      {},
      () => this.icfesService.promedioNacional()
    );
  }

  @Get('total-registros')
  @ApiOperation({
    summary: 'Total de registros',
    description: 'Devuelve el total de registros en la base de datos',
  })
  @ApiResponse({ status: 200, description: 'Total de registros obtenido correctamente' })
  @ApiResponse({ status: 500, description: 'Error al contar los registros' })
  totalRegistros() {
    return this.cacheService.remember(
      'total_registros',
      {},
      () => this.icfesService.totalRegistros()
    );
  }

  @Get('comparacion-colegios')
  @ApiOperation({
    summary: 'Comparación entre colegios oficiales y no oficiales',
    description: 'Devuelve promedio y total de estudiantes agrupados por tipo de colegio',
  })
  @ApiResponse({ status: 200, description: 'Comparación realizada correctamente' })
  @ApiResponse({ status: 500, description: 'Error al realizar la comparación' })
  comparacionColegios() {
    return this.cacheService.remember(
      'comparacion_colegios',
      {},
      () => this.icfesService.comparacionColegios()
    );
  }

  @Get('promedio-departamento')
  @ApiOperation({ summary: 'Promedio por departamentos', description: 'Devuelve el promedio de cada departamentos' })
  promedioDepartameto() {
    return this.icfesService.promedioDepartamentos();
  }

  @Get('promedio-zona')
  @ApiOperation({ summary: 'Promedio por zona urbana o rural', description: 'Devuelve el promedio por zona urbana o rural' })
  promedioZonal() {
    return this.cacheService.remember(
      'promedio_zona',
      {},
      () => this.icfesService.promedioZonal()
    );
  }

  @Get('top-municipios')
  @ApiOperation({ summary: 'Top de municipios', description: 'Devuelve los mejores 20 municipios' })
  topMunicipios() {
    return this.icfesService.topMunicipios();
  }

  @Get('promedio-edad')
  @ApiOperation({ summary: 'Promedio agrupado por edad', description: 'Devuelve el promedio de puntaje agrupado por edad' })
  promedioEdades() {
    return this.icfesService.promedioPorEdad();
  }

  @Get('promedio-por-ano')
  @ApiOperation({ summary: 'Promedio agrupado por año', description: 'Devuelve el promedio global agrupado por año' })
  promedioAnos() {
    return this.cacheService.remember(
      'promedio_por_ano',
      {},
      () => this.icfesService.promedioPorAno()
    );
  }

  @Get('top-departamentos')
  @ApiOperation({
    summary: 'Top de departamentos',
    description: 'Devuelve el top N de departamentos según promedio global',
  })
  topDepartamentos(@Query() dto: TopDepartamentos) {
    const parsedLimit = Number(dto.limit) || 5;

    return this.cacheService.remember(
      'top_departamentos',
      { limit: parsedLimit },
      () => this.icfesService.topDepartamentos(parsedLimit)
    );
  }


}
