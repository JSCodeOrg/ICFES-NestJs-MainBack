import { IcfesService } from 'src/icfes/icfes.service';
import { InstitucionService } from './institucion.service';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('institucion')
export class InstitucionController {
  constructor(private readonly institucionService: InstitucionService) {}

  @Get('total-instituciones')
  @ApiOperation({ summary: 'Total de instituciones indexadas', description: 'Devuelve el total de instituciones registradas en la base de datos.' })
  @ApiResponse({ status: 200, description: 'Conteo de instituciones' })
  totalInstituciones() {
    return this.institucionService.contarInstituciones();
  }

  @Get('sector-lider-performance')
  @ApiOperation({ summary: 'Sector de mejor rendimiento', description: 'Devuelve el sector con el mejor rendimiento' })
  @ApiResponse({ status: 200, description: 'Sector con mejor rendimiento' })
  mejorRendimiento() {
    return this.institucionService.sectorLiderPerformance();
  }

  @Get('ranking-departamentos')
  @ApiOperation({
    summary: 'Ranking nacional de instituciones',
    description: 'Devuelve instituciones ordenadas por promedio global descendente',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de instituciones',
  })
  rankingDepartamentos(@Query('page') page = 1, @Query('limit') limit = 5) {
    return this.institucionService.rankingDepartamentos(Number(page), Number(limit));
  }

  @Get('ranking-departamento/:departamento')
  @ApiOperation({
    summary: 'Ranking por departamento',
    description: 'Devuelve instituciones filtradas por departamento, municipio y naturaleza',
  })
  @ApiParam({
    name: 'departamento',
    example: 'ANTIOQUIA',
  })
  @ApiQuery({
    name: 'municipio',
    required: false,
    example: 'MEDELLIN',
  })
  @ApiQuery({
    name: 'naturaleza',
    required: false,
    example: 'OFICIAL',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de instituciones',
  })
  rankingDepartamento(
    @Param('departamento')
    departamento: string,

    @Query('municipio')
    municipio?: string,

    @Query('naturaleza')
    naturaleza?: string,

    @Query('page')
    page = 1,

    @Query('limit')
    limit = 5,
  ) {
    return this.institucionService.rankingDepartamento(departamento, municipio, naturaleza, Number(page), Number(limit));
  }

  @Get('buscar')
  @ApiOperation({
    summary: 'Buscar instituciones',
    description: 'Busca instituciones por nombre o código DANE',
  })
  @ApiQuery({ name: 'q', required: true, example: 'Liceo' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  buscarInstituciones(
    @Query('q') q: string,
    @Query('limit') limit = 10,
  ) {
    if (!q || q.trim().length < 2) return [];
    return this.institucionService.buscarInstituciones(q, Number(limit));
  }

  @Get('municipios/:departamento')
  @ApiOperation({
    summary: 'Municipios por departamento',
    description: 'Devuelve la lista de municipios pertenecientes a un departamento',
  })
  @ApiParam({
    name: 'departamento',
    example: 'ANTIOQUIA',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de municipios',
  })
  obtenerMunicipios(@Param('departamento') departamento: string) {
    return this.institucionService.obtenerMunicipios(departamento);
  }

  @Get(':codigoDane')
  @ApiOperation({
    summary: 'Información completa de una institución',
  })
  obtenerInstitucion(
    @Param('codigoDane')
    codigoDane: string,
  ) {
    return this.institucionService.obtenerInstitucion(codigoDane);
  }

  @Get('promedio-sector/:naturaleza')
  @ApiOperation({
    summary: 'Promedio sector',
    description: 'Devuelve el promedio global del sector (OFICIAL / NO OFICIAL)',
  })
  @ApiParam({
    name: 'naturaleza',
    example: 'OFICIAL',
  })
  @ApiResponse({
    status: 200,
    description: 'Promedio del sector',
  })
  promedioSector(@Param('naturaleza') naturaleza: string) {
    return this.institucionService.promedioSector(naturaleza);
  }
}
