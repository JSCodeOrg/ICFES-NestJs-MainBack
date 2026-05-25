import { Controller, Get, Query } from '@nestjs/common';
import { IcfesService } from './icfes.service';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PromedioAnualDto } from './dto/promedioAnualDto';
import { CacheService } from '../cache/cache.service';
import { TopDepartamentos } from './dto/topDepartamentos';
import { Departamento } from './dto/departamentoDto';
import { TopMunicipiosDepartamento } from './dto/TopMunicipiosDepartamento';
import { PromedioDepartamentoDto } from './dto/promedioDepartamentoDto';
import { ComparacionDepartamentosDto } from './dto/comparacionDepartamentosDto';
import { EvolucionFiltrosDto } from './dto/Evolucionfiltrosdto';
import { DistribucionPorAnoDto } from './dto/DistribucionPoranoDto';
import { ParticipacionPorAnoDto } from './dto/ParticipacionPorAnoDto';

@Controller('icfes')
export class IcfesController {
  constructor(
    private readonly icfesService: IcfesService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('distribucion-genero')
  @ApiOperation({
    summary: 'Distribución por género del exámen',
    description: 'Devuelve la distribución por género del examen agrupados anualmente.',
  })
  @ApiResponse({ status: 200, description: 'Conteo por género y porcentaje' })
  @ApiResponse({ status: 500, description: 'Ocurrió un error al calcular la distribución por género' })
  distribucionGenero() {
    return this.cacheService.remember('distribucion_genero', {}, () =>
      this.icfesService.distribucionGeneroPorAnio(),
    );
  }

  @Get('promedio-anual')
  @ApiOperation({
    summary: 'Promedio anual del examen según el año',
    description: 'Devuelve el promedio nacional al recibir el año',
  })
  @ApiResponse({ status: 200, description: 'Promedio del año seleccionado' })
  @ApiResponse({ status: 400, description: 'El año solicitado no está contenido dentro del intérvalo 2014-2022' })
  promedioAnual(@Query() dto: PromedioAnualDto) {
    return this.cacheService.remember('promedio_anual', dto, () =>
      this.icfesService.promedioAnual(dto),
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
    return this.cacheService.remember('promedio_nacional', {}, () =>
      this.icfesService.promedioNacional(),
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
    return this.cacheService.remember('total_registros', {}, () =>
      this.icfesService.totalRegistros(),
    );
  }

  @Get('promedio-departamento')
  @ApiOperation({
    summary: 'Promedio por departamentos',
    description: 'Devuelve el promedio del departamento solicitado',
  })
  promedioDepartamento(@Query() dto: PromedioDepartamentoDto) {
    return this.cacheService.remember('promedio_departamento', dto, () =>
      this.icfesService.promedioDepartamentos(dto.departamento),
    );
  }

  @Get('promedio-zona')
  @ApiOperation({
    summary: 'Promedio por zona urbana o rural',
    description: 'Devuelve el promedio por zona urbana o rural',
  })
  promedioZonal() {
    return this.cacheService.remember('promedio_zona', {}, () =>
      this.icfesService.promedioZonal(),
    );
  }

  @Get('top-municipios')
  @ApiOperation({
    summary: 'Top de municipios',
    description: 'Devuelve los mejores 20 municipios',
  })
  topMunicipios() {
    return this.icfesService.topMunicipios();
  }

  @Get('promedio-edad')
  @ApiOperation({
    summary: 'Promedio agrupado por edad',
    description: 'Devuelve el promedio de puntaje agrupado por edad',
  })
  promedioEdades() {
    return this.icfesService.promedioPorEdad();
  }

  @Get('top-departamentos')
  @ApiOperation({
    summary: 'Top de departamentos',
    description: 'Devuelve el top N de departamentos según promedio global',
  })
  topDepartamentos(@Query() dto: TopDepartamentos) {
    const parsedLimit = Number(dto.limit) || 5;
    return this.cacheService.remember('top_departamentos', { limit: parsedLimit }, () =>
      this.icfesService.topDepartamentos(parsedLimit),
    );
  }

  @Get('promedio-anual-departamento')
  @ApiOperation({
    summary: 'Promedio anual de un departamento',
    description: 'Devuelve el promedio de un departamento agrupado por todos los años',
  })
  promedioDepartamentoAgrupado(@Query() dto: Departamento) {
    return this.cacheService.remember('promedio_anual_departamento', { dto }, () =>
      this.icfesService.getPromedioHistoricoPorDepartamento(dto.departamento),
    );
  }

  @Get('distribucion-puntaje-departamento')
  @ApiOperation({
    summary: 'Distribución del puntaje por departamento',
    description: 'Devuelve la cantidad de estudiantes por categoría de puntaje en un departamento',
  })
  distribucionPuntajeDepartamento(@Query() dto: Departamento) {
    return this.cacheService.remember('distribucion_puntaje_departamento', { dto }, () =>
      this.icfesService.distribucionPuntajeGlobalPorDepartamento(dto.departamento),
    );
  }

  @Get('top-municipios-departamento')
  @ApiOperation({
    summary: 'Top municipios de un departamento',
    description: 'Devuelve el top específico de los municipios de un departamento',
  })
  topMunicipiosDepartamento(@Query() dto: TopMunicipiosDepartamento) {
    return this.cacheService.remember('top_municipios_departamento', { dto }, () =>
      this.icfesService.getTopMunicipiosPorDepartamento(dto.departamento, dto.limit),
    );
  }

  @Get('bottom-municipios-departamento')
  @ApiOperation({
    summary: 'Bottom municipios de un departamento',
    description: 'Devuelve los municipios con menor promedio en un departamento',
  })
  bottomMunicipiosDepartamento(@Query() dto: TopMunicipiosDepartamento) {
    return this.cacheService.remember('bottom_municipios_departamento', { dto }, () =>
      this.icfesService.getBottomMunicipiosDepartamento(dto.departamento, dto.limit),
    );
  }

  @Get('metricas-municipios-departamento')
  @ApiOperation({
    summary: 'Métricas por municipio de un departamento',
    description: 'Devuelve promedio, total de estudiantes y desviación estándar por municipio',
  })
  metricasMunicipiosDepartamento(@Query() dto: Departamento) {
    return this.cacheService.remember('metricas_municipios_departamento', { dto }, () =>
      this.icfesService.getMetricasMunicipiosPorDepartamento(dto.departamento),
    );
  }

  @Get('distribucion-socioeconomica-departamento')
  @ApiOperation({
    summary: 'Distribución socioeconómica de un departamento',
    description: 'Devuelve la distribución porcentual por cada estrato dado un departamento',
  })
  distribucionSocioeconomica(@Query() dto: Departamento) {
    return this.cacheService.remember('distribucion_socioeconomica_departamento', { dto }, () =>
      this.icfesService.getDistribucionEstratoDepartamento(dto.departamento),
    );
  }

  @Get('comparacion-acceso-tecnologico')
  @ApiOperation({
    summary: 'Comparación de acceso tecnológico',
    description: 'Devuelve el porcentaje de acceso a internet y computador entre dos departamentos',
  })
  comparacionAccesoTecnologico(@Query() dto: ComparacionDepartamentosDto) {
    return this.cacheService.remember('comparacion_acceso_tecnologico', { dto }, () =>
      this.icfesService.getComparacionAccesoTecnologico(dto.departamentoA, dto.departamentoB),
    );
  }

  @Get('promedio-por-ano')
  @ApiOperation({
    summary: 'Promedio global por año con filtros opcionales',
    description:
      'Devuelve el promedio global agrupado por año. ' +
      'Acepta filtros opcionales: departamento, genero (M|F), zona (URBANO|RURAL), ' +
      'naturaleza (OFICIAL|NO OFICIAL). Permite superponer líneas en el frontend.',
  })
  @ApiQuery({ name: 'departamento', required: false, example: 'VALLE' })
  @ApiQuery({ name: 'genero',       required: false, enum: ['M', 'F'] })
  @ApiQuery({ name: 'zona',         required: false, enum: ['URBANO', 'RURAL'] })
  @ApiQuery({ name: 'naturaleza',   required: false, enum: ['OFICIAL', 'NO OFICIAL'] })
  @ApiResponse({ status: 200, description: 'Promedio por año calculado correctamente' })
  @ApiResponse({ status: 500, description: 'Error al calcular el promedio por año' })
  promedioAnos(@Query() dto: EvolucionFiltrosDto) {
    return this.cacheService.remember('promedio_por_ano', dto, () =>
      this.icfesService.promedioPorAno(dto),
    );
  }

  @Get('promedio-materias-por-ano')
  @ApiOperation({
    summary: 'Promedio de materias por año con filtros opcionales',
    description:
      'Devuelve el promedio de Lectura Crítica, Matemáticas, Sociales, Naturales e Inglés ' +
      'agrupado por año. Acepta los mismos filtros que promedio-por-ano.',
  })
  @ApiQuery({ name: 'departamento', required: false, example: 'VALLE' })
  @ApiQuery({ name: 'genero',       required: false, enum: ['M', 'F'] })
  @ApiQuery({ name: 'zona',         required: false, enum: ['URBANO', 'RURAL'] })
  @ApiQuery({ name: 'naturaleza',   required: false, enum: ['OFICIAL', 'NO OFICIAL'] })
  @ApiResponse({ status: 200, description: 'Promedios de materias calculados correctamente' })
  @ApiResponse({ status: 500, description: 'Error al calcular el promedio de materias por año' })
  promedioMateriasPorAno(@Query() dto: EvolucionFiltrosDto) {
    return this.cacheService.remember('promedio_materias_por_ano', dto, () =>
      this.icfesService.promedioPorMateriaPorAno(dto),
    );
  }

  @Get('comparacion-colegios')
  @ApiOperation({
    summary: 'Comparación entre colegios oficiales y no oficiales con filtros opcionales',
    description:
      'Devuelve promedio y total de estudiantes agrupados por tipo de colegio y año, ' +
      'ordenados cronológicamente. Acepta filtros opcionales: departamento, genero, zona.',
  })
  @ApiQuery({ name: 'departamento', required: false, example: 'VALLE' })
  @ApiQuery({ name: 'genero',       required: false, enum: ['M', 'F'] })
  @ApiQuery({ name: 'zona',         required: false, enum: ['URBANO', 'RURAL'] })
  @ApiResponse({ status: 200, description: 'Comparación realizada correctamente' })
  @ApiResponse({ status: 500, description: 'Error al realizar la comparación' })
  comparacionColegios(@Query() dto: EvolucionFiltrosDto) {

    const { naturaleza, ...filtros } = dto;
    return this.cacheService.remember('comparacion_colegios', filtros, () =>
      this.icfesService.comparacionColegios(filtros),
    );
  }

  @Get('distribucion-puntajes-por-ano')
  @ApiOperation({
    summary: 'Distribución de puntajes por año (heatmap / ridgeline)',
    description:
      'Devuelve la cantidad de estudiantes por rango de puntaje (0-100, 100-200, …) y año. ' +
      'Acepta filtros opcionales: departamento, genero, zona, naturaleza.',
  })
  @ApiQuery({ name: 'departamento', required: false, example: 'VALLE' })
  @ApiQuery({ name: 'genero',       required: false, enum: ['M', 'F'] })
  @ApiQuery({ name: 'zona',         required: false, enum: ['URBANO', 'RURAL'] })
  @ApiQuery({ name: 'naturaleza',   required: false, enum: ['OFICIAL', 'NO OFICIAL'] })
  @ApiResponse({ status: 200, description: 'Distribución calculada correctamente' })
  @ApiResponse({ status: 500, description: 'Error al calcular la distribución de puntajes' })
  distribucionPuntajesPorAno(@Query() dto: DistribucionPorAnoDto) {
    return this.cacheService.remember('distribucion_puntajes_por_ano', dto, () =>
      this.icfesService.distribucionPuntajesPorAno(dto),
    );
  }

  @Get('participacion-por-ano')
  @ApiOperation({
    summary: 'Total de estudiantes por año con segmentación opcional',
    description:
      'Devuelve el total de estudiantes evaluados por año. ' +
      'Acepta filtros opcionales: departamento, genero, zona, naturaleza. ' +
      'Parámetro especial "segmentar" (genero | zona): desglosa en líneas separadas ' +
      'para evitar múltiples llamadas desde el frontend.',
  })
  @ApiResponse({ status: 200, description: 'Participación calculada correctamente' })
  @ApiResponse({ status: 500, description: 'Error al calcular la participación por año' })
  participacionPorAno(@Query() dto: ParticipacionPorAnoDto) {
    const { segmentar, ...filtros } = dto;
    return this.cacheService.remember(
      'participacion_por_ano',
      dto,
      () => this.icfesService.participacionPorAno(filtros, segmentar),
    );
  }
}