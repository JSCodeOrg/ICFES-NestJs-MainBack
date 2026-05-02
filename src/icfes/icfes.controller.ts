import { Controller, Get, Query } from '@nestjs/common';
import { IcfesService } from './icfes.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PromedioAnualDto } from './dto/promedioAnualDto';

@Controller('icfes')
export class IcfesController {
  constructor(private readonly icfesService: IcfesService) { }

  @ApiBearerAuth()
  @Get('distribucion-genero')
  @ApiOperation({
    summary: 'Distribución por género del exámen',
    description: 'Devuelve el conteo y porcentaje de estudiantes agrupados por género',
  })
  @ApiResponse({ status: 200, description: 'Conteo por género y porcentaje' })
  @ApiResponse({ status: 500, description: 'Ocurrió un error al calcular la distribución por género' })
  distribucionGenero() {
    return this.icfesService.distribucionGeneroPorAnio();
  }

  @ApiBearerAuth()
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

  @Get('promedio-departamento')
  @ApiOperation({ summary: 'Promedio por departamentos', description: 'Devuelve el promedio de cada departamentos' })
  promedioDepartameto() {
    return this.icfesService.promedioDepartamentos();
  }

  @Get('promedio-zona')
  @ApiOperation({ summary: 'Promedio por zona urbana o rural', description: 'Devuelve el promedio por zona urbana o rural' })
    promedioZonal(){
    return this.icfesService.promedioZonal();
  }

  @Get('top-municipios')
  @ApiOperation({summary: 'Top de municipios', description: 'Devuelve los mejores 20 municipios'})
  topMunicipios(){
    return this.icfesService.topMunicipios();
  }

  @Get('promedio-edad')
  @ApiOperation({summary: 'Promedio agrupado por edad', description: 'Devuelve el promedio de puntaje agrupado por edad'})
  promedioEdades(){
    return this.icfesService.promedioPorEdad();
  }


}
