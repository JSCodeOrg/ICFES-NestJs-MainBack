import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Resultado } from './schema/icfes.schema';
import { Model } from 'mongoose';
import { PromedioAnualDto } from './dto/promedioAnualDto';
import { CacheService } from '../cache/cache.service';
import { EvolucionFiltrosDto } from './dto/Evolucionfiltrosdto';
import { DistribucionPorAnoDto } from './dto/DistribucionPoranoDto';

@Injectable()
export class IcfesService {
  constructor(
    @InjectModel(Resultado.name)
    private readonly resultadoModel: Model<Resultado>,
    private readonly cacheService: CacheService,
  ) {}

  private buildFiltrosMatch(filtros: EvolucionFiltrosDto | DistribucionPorAnoDto): Record<string, unknown> {
    const match: Record<string, unknown> = {};

    if (filtros.departamento) {
      match['ESTU_DEPTO_RESIDE'] = filtros.departamento.toUpperCase();
    }
    if (filtros.genero) {
      match['ESTU_GENERO'] = filtros.genero;
    }
    if (filtros.zona) {
      match['COLE_AREA_UBICACION'] = filtros.zona.toUpperCase();
    }
    if (filtros.naturaleza) {
      match['COLE_NATURALEZA'] = filtros.naturaleza.toUpperCase();
    }

    const desde = filtros.anoDesde;
    const hasta = filtros.anoHasta;
    if (desde || hasta) {
      const rango: Record<string, number> = {};
      if (desde) rango['$gte'] = Number(desde);
      if (hasta) rango['$lte'] = Number(hasta);
      match['ANIO_EXAMEN'] = rango;
    }

    return match;
  }

  async distribucionGeneroPorAnio() {
    try {
      return this.resultadoModel.aggregate([
        {
          $group: {
            _id: {
              anio: '$ANIO_EXAMEN',
              genero: '$ESTU_GENERO',
            },
            cantidad: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.anio',
            total: { $sum: '$cantidad' },
            generos: {
              $push: {
                genero: '$_id.genero',
                cantidad: '$cantidad',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            key: { $toString: '$_id' },
            values: {
              $map: {
                input: ['M', 'F'],
                as: 'g',
                in: {
                  $let: {
                    vars: {
                      match: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$generos',
                              as: 'item',
                              cond: { $eq: ['$$item.genero', '$$g'] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      $multiply: [
                        {
                          $divide: [{ $ifNull: ['$$match.cantidad', 0] }, '$total'],
                        },
                        100,
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        {
          $sort: { key: 1 },
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async promedioAnual(dto: PromedioAnualDto) {
    try {
      const anosvalidos = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];
      const { ano } = dto;

      if (!anosvalidos.includes(ano)) {
        throw new BadRequestException('El año solicitado no está contenido dentro del intérvalo 2014-2022');
      }

      return this.resultadoModel.aggregate([
        {
          $match: {
            ANIO_EXAMEN: ano,
          },
        },
        {
          $group: {
            _id: null,
            promedio: { $avg: '$PUNT_GLOBAL' },
          },
        },
        {
          $project: {
            _id: 0,
            promedio: 1,
          },
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
  async promedioNacional(anio?: number, departamento?: string) {
    try {
      return this.resultadoModel.aggregate([
        {
          $match: {
            PUNT_GLOBAL: { $ne: null },
            ...(anio && { ANIO_EXAMEN: anio }),
            ...(departamento && { ESTU_DEPTO_RESIDE: departamento }),
          },
        },
        {
          $group: {
            _id: null,
            promedio: { $avg: '$PUNT_GLOBAL' },
          },
        },
        {
          $project: {
            _id: 0,
            promedio: 1,
          },
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
  async totalRegistros() {
    try {
      return this.resultadoModel.aggregate([
        {
          $match: {},
        },
        {
          $count: 'total',
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async comparacionColegios(filtros: EvolucionFiltrosDto = {}) {
    try {
      const { naturaleza, ...restoFiltros } = filtros;
      const matchBase = this.buildFiltrosMatch(restoFiltros);

      return this.resultadoModel.aggregate([
        {
          $match: {
            COLE_NATURALEZA: { $in: ['OFICIAL', 'NO OFICIAL'] },
            PUNT_GLOBAL: { $ne: null },
            ...matchBase,
          },
        },
        {
          $group: {
            _id: {
              tipo: '$COLE_NATURALEZA',
              anio: '$ANIO_EXAMEN',
            },
            promedio: { $avg: '$PUNT_GLOBAL' },
            total_estudiantes: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            tipo: '$_id.tipo',
            key: { $toString: '$_id.anio' },
            value: { $round: ['$promedio', 1] },
            total_estudiantes: 1,
          },
        },
        {
          $sort: { key: 1 },
        },
        {
          $group: {
            _id: '$tipo',
            data: {
              $push: {
                key: '$key',
                value: '$value',
                total_estudiantes: '$total_estudiantes',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            tipo_colegio: '$_id',
            data: 1,
          },
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException('Error al comparar colegios');
    }
  }

  async promedioDepartamentos(departamento?: string) {
    const resultados = await this.resultadoModel.aggregate([
      {
        $match: {
          PUNT_GLOBAL: { $ne: null },
          ESTU_DEPTO_RESIDE: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$ESTU_DEPTO_RESIDE',
          promedio: { $avg: '$PUNT_GLOBAL' },
          total_estudiantes: { $sum: 1 },
        },
      },
      {
        $sort: { promedio: -1 },
      },
      {
        $setWindowFields: {
          sortBy: { promedio: -1 },
          output: {
            ranking: { $denseRank: {} },
          },
        },
      },
      {
        $project: {
          _id: 0,
          departamento: '$_id',
          promedio: { $round: ['$promedio', 2] },
          total_estudiantes: 1,
          ranking: 1,
        },
      },
    ]);

    if (departamento) {
      return resultados.filter((r) => r.departamento === departamento);
    }

    return resultados;
  }

  async promedioZonal() {
    return this.resultadoModel.aggregate([
      {
        $match: {
          COLE_AREA_UBICACION: { $ne: null },
          PUNT_GLOBAL: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$COLE_AREA_UBICACION',
          promedio: { $avg: '$PUNT_GLOBAL' },
          total_estudiantes: { $sum: 1 },
        },
      },
      {
        $sort: { promedio: -1 },
      },
      {
        $project: {
          _id: 0,
          zona: '$_id',
          promedio: { $round: ['$promedio', 2] },
          total_estudiantes: 1,
        },
      },
    ]);
  }

  async topMunicipios() {
    return this.resultadoModel.aggregate([
      {
        $match: {
          ESTU_MCPIO_RESIDE: { $ne: null },
          PUNT_GLOBAL: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$ESTU_MCPIO_RESIDE',
          promedio: { $avg: '$PUNT_GLOBAL' },
          total_estudiantes: { $sum: 1 },
        },
      },
      {
        $sort: { promedio: -1 },
      },
      {
        $limit: 15,
      },
      {
        $project: {
          _id: 0,
          municipio: '$_id',
          promedio: { $round: ['$promedio', 2] },
          total_estudiantes: 1,
        },
      },
    ]);
  }

  async promedioPorEdad(filters?: { anio?: number; departamento?: string }) {
    const match: any = {};

    if (filters?.anio) {
      match.PERIODO = filters.anio;
    }

    if (filters?.departamento) {
      match.DEPARTAMENTO_ESTABLECIMIENTO = filters.departamento;
    }

    const res = await this.resultadoModel.aggregate([
      {
        $match: {
          ...match,
          EDAD: { $ne: null },
          PUNT_GLOBAL: { $ne: null },
        },
      },

      {
        $addFields: {
          grupoEdad: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [{ $gte: ['$EDAD', 14] }, { $lte: ['$EDAD', 15] }],
                  },
                  then: '14-15',
                },
                {
                  case: {
                    $and: [{ $gte: ['$EDAD', 16] }, { $lte: ['$EDAD', 17] }],
                  },
                  then: '16-17',
                },
                {
                  case: {
                    $and: [{ $gte: ['$EDAD', 18] }, { $lte: ['$EDAD', 19] }],
                  },
                  then: '18-19',
                },
                {
                  case: {
                    $and: [{ $gte: ['$EDAD', 20] }, { $lte: ['$EDAD', 21] }],
                  },
                  then: '20-21',
                },
                {
                  case: {
                    $and: [{ $gte: ['$EDAD', 22] }, { $lte: ['$EDAD', 23] }],
                  },
                  then: '22-23',
                },
                {
                  case: {
                    $and: [{ $gte: ['$EDAD', 24] }, { $lte: ['$EDAD', 25] }],
                  },
                  then: '24-25',
                },
                {
                  case: {
                    $gte: ['$EDAD', 26],
                  },
                  then: '26+',
                },
              ],
              default: 'Sin dato',
            },
          },
        },
      },

      {
        $group: {
          _id: '$grupoEdad',
          promedio: {
            $avg: '$PUNT_GLOBAL',
          },
          total: {
            $sum: 1,
          },
        },
      },

      {
        $addFields: {
          orden: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', '14-15'] }, then: 1 },
                { case: { $eq: ['$_id', '16-17'] }, then: 2 },
                { case: { $eq: ['$_id', '18-19'] }, then: 3 },
                { case: { $eq: ['$_id', '20-21'] }, then: 4 },
                { case: { $eq: ['$_id', '22-23'] }, then: 5 },
                { case: { $eq: ['$_id', '24-25'] }, then: 6 },
                { case: { $eq: ['$_id', '26+'] }, then: 7 },
              ],
              default: 99,
            },
          },
        },
      },

      {
        $sort: {
          orden: 1,
        },
      },

      {
        $project: {
          _id: 0,
          edad: '$_id',
          promedio: {
            $round: ['$promedio', 2],
          },
          total: 1,
        },
      },
    ]);

    return res;
  }

  async promedioPorAno(filtros: EvolucionFiltrosDto = {}) {
    try {
      const matchBase = this.buildFiltrosMatch(filtros);

      return await this.resultadoModel.aggregate([
        {
          $match: {
            PUNT_GLOBAL: { $ne: null },
            ANIO_EXAMEN: { $ne: null },
            ...matchBase,
          },
        },
        {
          $group: {
            _id: '$ANIO_EXAMEN',
            promedio: { $avg: '$PUNT_GLOBAL' },
            total_estudiantes: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            _id: 0,
            ano: '$_id',
            promedio: { $round: ['$promedio', 2] },
            total_estudiantes: 1,
          },
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException('Error al calcular el promedio por año');
    }
  }

  async promedioPorMateriaPorAno(filtros: EvolucionFiltrosDto = {}) {
    try {
      const matchBase = this.buildFiltrosMatch(filtros);

      return await this.resultadoModel.aggregate([
        {
          $match: {
            ANIO_EXAMEN: { $ne: null },
            ...matchBase,
          },
        },
        {
          $group: {
            _id: '$ANIO_EXAMEN',
            lectCritica: { $avg: '$PUNT_LECTURA_CRITICA' },
            matematicas: { $avg: '$PUNT_MATEMATICAS' },
            sociales: { $avg: '$PUNT_SOCIALES_CIUDADANAS' },
            naturales: { $avg: '$PUNT_C_NATURALES' },
            ingles: { $avg: '$PUNT_INGLES' },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            _id: 0,
            ano: '$_id',
            'Lectura Crítica': { $round: ['$lectCritica', 2] },
            Matemáticas: { $round: ['$matematicas', 2] },
            Sociales: { $round: ['$sociales', 2] },
            Naturales: { $round: ['$naturales', 2] },
            Inglés: { $round: ['$ingles', 2] },
          },
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException('Error al calcular el promedio de materias por año');
    }
  }

  async topDepartamentos(limit: number = 5) {
    try {
      return this.resultadoModel.aggregate([
        {
          $match: {
            ESTU_DEPTO_RESIDE: { $ne: null },
            PUNT_GLOBAL: { $ne: null },
          },
        },
        {
          $group: {
            _id: '$ESTU_DEPTO_RESIDE',
            promedio: { $avg: '$PUNT_GLOBAL' },
            total_estudiantes: { $sum: 1 },
          },
        },
        {
          $sort: { promedio: -1 },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            _id: 0,
            departamento: '$_id',
            promedio: { $round: ['$promedio', 2] },
            total_estudiantes: 1,
          },
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getPromedioHistoricoPorDepartamento(departamento: string) {
    try {
      const result = this.resultadoModel.aggregate([
        {
          $match: {
            ESTU_DEPTO_RESIDE: departamento,
          },
        },
        {
          $group: {
            _id: '$ANIO_EXAMEN',
            promedio: { $avg: '$PUNT_GLOBAL' },
          },
        },
        {
          $project: {
            _id: 0,
            year: '$_id',
            promedio: { $round: ['$promedio', 2] },
          },
        },
        {
          $sort: { year: 1 },
        },
      ]);

      return result;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener el promedio histórico del departamento');
    }
  }

  async distribucionPuntajeGlobalPorDepartamento(departamento: string) {
    return this.resultadoModel.aggregate([
      {
        $match: {
          PUNT_GLOBAL: { $ne: null },
          CAT_PUNT_GLOBAL: { $ne: null },
          ESTU_DEPTO_RESIDE: departamento,
        },
      },
      {
        $group: {
          _id: '$CAT_PUNT_GLOBAL',
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          categoria: '$_id',
          total: 1,
        },
      },
    ]);
  }

  async distribucionPuntajesPorAno(filtros: DistribucionPorAnoDto = {}) {
    try {
      const matchBase = this.buildFiltrosMatch(filtros);

      const rangos = [
        { label: '0-100', min: 0, max: 100 },
        { label: '100-200', min: 100, max: 200 },
        { label: '200-300', min: 200, max: 300 },
        { label: '300-400', min: 300, max: 400 },
        { label: '400-500', min: 400, max: 500 },
      ];

      return await this.resultadoModel.aggregate([
        {
          $match: {
            PUNT_GLOBAL: { $ne: null, $gte: 0 },
            ANIO_EXAMEN: { $ne: null },
            ...matchBase,
          },
        },
        {
          $addFields: {
            rango: {
              $switch: {
                branches: rangos.map((r) => ({
                  case: {
                    $and: [{ $gte: ['$PUNT_GLOBAL', r.min] }, { $lt: ['$PUNT_GLOBAL', r.max] }],
                  },
                  then: r.label,
                })),
                default: '500+',
              },
            },
          },
        },
        {
          $group: {
            _id: {
              ano: '$ANIO_EXAMEN',
              rango: '$rango',
            },
            cantidad: { $sum: 1 },
          },
        },
        {
          $sort: { '_id.ano': 1 },
        },
        {
          $project: {
            _id: 0,
            ano: '$_id.ano',
            rango: '$_id.rango',
            cantidad: 1,
          },
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException('Error al calcular la distribución de puntajes por año');
    }
  }

  async getTopMunicipiosPorDepartamento(departamento: string, limit: number) {
    try {
      const result = this.resultadoModel.aggregate([
        {
          $match: {
            ESTU_DEPTO_RESIDE: departamento.toUpperCase(),
          },
        },
        {
          $group: {
            _id: '$ESTU_MCPIO_RESIDE',
            promedio: { $avg: '$PUNT_GLOBAL' },
          },
        },
        {
          $project: {
            _id: 0,
            municipio: '$_id',
            promedio: { $round: ['$promedio', 2] },
          },
        },
        {
          $sort: { promedio: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      return result;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener el top de municipios');
    }
  }

  async getBottomMunicipiosDepartamento(departamento: string, limit: number) {
    try {
      const result = this.resultadoModel.aggregate([
        {
          $match: {
            ESTU_DEPTO_RESIDE: departamento,
          },
        },
        {
          $group: {
            _id: '$ESTU_MCPIO_RESIDE',
            promedio: { $avg: '$PUNT_GLOBAL' },
          },
        },
        {
          $project: {
            _id: 0,
            municipio: '$_id',
            promedio: { $round: ['$promedio', 2] },
          },
        },
        {
          $sort: { promedio: 1 },
        },
        {
          $limit: limit,
        },
      ]);

      return result;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener el bottom de municipios del departamento');
    }
  }

  async getMetricasMunicipiosPorDepartamento(departamento: string) {
    try {
      const result = await this.resultadoModel.aggregate([
        {
          $match: {
            ESTU_DEPTO_RESIDE: departamento.toUpperCase(),
          },
        },
        {
          $group: {
            _id: '$ESTU_MCPIO_RESIDE',
            promedio: { $avg: '$PUNT_GLOBAL' },
            total_estudiantes: { $sum: 1 },
            desviacion: { $stdDevPop: '$PUNT_GLOBAL' },
          },
        },
        {
          $project: {
            _id: 0,
            municipio: '$_id',
            promedio: { $round: ['$promedio', 2] },
            total_estudiantes: 1,
            desviacion: { $round: ['$desviacion', 2] },
          },
        },
        {
          $sort: { promedio: -1 },
        },
      ]);

      return result;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener métricas de municipios');
    }
  }

  async getDistribucionEstratoDepartamento(departamento: string) {
    try {
      return this.resultadoModel.aggregate([
        {
          $match: {
            ESTU_DEPTO_RESIDE: departamento,
            FAMI_ESTRATOVIVIENDA: {
              $in: ['1', '2', '3', '4', '5', '6'],
            },
          },
        },
        {
          $group: {
            _id: '$FAMI_ESTRATOVIVIENDA',
            cantidad: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$cantidad' },
            estratos: {
              $push: {
                estrato: '$_id',
                cantidad: '$cantidad',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            data: {
              $map: {
                input: ['1', '2', '3', '4', '5', '6'],
                as: 'estrato',
                in: {
                  key: {
                    $concat: ['Estrato ', '$$estrato'],
                  },
                  value: {
                    $let: {
                      vars: {
                        match: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$estratos',
                                as: 'item',
                                cond: {
                                  $eq: ['$$item.estrato', '$$estrato'],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: {
                        $multiply: [
                          {
                            $divide: [
                              {
                                $ifNull: ['$$match.cantidad', 0],
                              },
                              '$total',
                            ],
                          },
                          100,
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $unwind: '$data',
        },
        {
          $replaceRoot: {
            newRoot: '$data',
          },
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getComparacionAccesoTecnologico(departamentoA: string, departamentoB: string) {
    try {
      const result = await this.resultadoModel.aggregate([
        {
          $match: {
            ESTU_DEPTO_RESIDE: {
              $in: [departamentoA, departamentoB],
            },

            FAMI_TIENEINTERNET: {
              $in: [0, 1],
            },

            FAMI_TIENECOMPUTADOR: {
              $in: [0, 1],
            },
          },
        },

        {
          $group: {
            _id: '$ESTU_DEPTO_RESIDE',

            internet: {
              $avg: '$FAMI_TIENEINTERNET',
            },

            computador: {
              $avg: '$FAMI_TIENECOMPUTADOR',
            },
          },
        },
      ]);

      const deptoA = result.find((d) => d._id === departamentoA);

      const deptoB = result.find((d) => d._id === departamentoB);

      return [
        {
          key: 'Internet',
          values: [(deptoA?.internet ?? 0) * 100, (deptoB?.internet ?? 0) * 100],
        },

        {
          key: 'Computador',
          values: [(deptoA?.computador ?? 0) * 100, (deptoB?.computador ?? 0) * 100],
        },
      ];
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async promedioNacionalMaterias() {
    const [resultado] = await this.resultadoModel.aggregate([
      {
        $group: {
          _id: null,

          lectura_critica: {
            $avg: '$PUNT_LECTURA_CRITICA',
          },

          matematicas: {
            $avg: '$PUNT_MATEMATICAS',
          },

          ciencias_naturales: {
            $avg: '$PUNT_C_NATURALES',
          },

          sociales_ciudadanas: {
            $avg: '$PUNT_SOCIALES_CIUDADANAS',
          },

          ingles: {
            $avg: '$PUNT_INGLES',
          },
        },
      },

      {
        $project: {
          _id: 0,

          materias: [
            {
              materia: 'Lectura Crítica',

              promedio: {
                $round: ['$lectura_critica', 2],
              },
            },

            {
              materia: 'Matemáticas',

              promedio: {
                $round: ['$matematicas', 2],
              },
            },

            {
              materia: 'Ciencias Naturales',

              promedio: {
                $round: ['$ciencias_naturales', 2],
              },
            },

            {
              materia: 'Sociales Ciudadanas',

              promedio: {
                $round: ['$sociales_ciudadanas', 2],
              },
            },

            {
              materia: 'Inglés',

              promedio: {
                $round: ['$ingles', 2],
              },
            },
          ],
        },
      },
    ]);

    return resultado;
  }

  async desempenoIngles(codigoDane: number) {
    const [resultado] = await this.resultadoModel.aggregate([
      {
        $match: {
          COLE_COD_DANE_ESTABLECIMIENTO: codigoDane,
          DESEMP_INGLES: {
            $ne: null,
          },
          PUNT_INGLES: {
            $ne: null,
          },
        },
      },

      {
        $group: {
          _id: '$DESEMP_INGLES',

          promedio_ingles: {
            $avg: '$PUNT_INGLES',
          },

          total_estudiantes: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          total_estudiantes: -1,
        },
      },

      {
        $limit: 1,
      },

      {
        $project: {
          _id: 0,

          nivel: '$_id',

          promedio_ingles: {
            $round: ['$promedio_ingles', 2],
          },

          total_estudiantes: 1,
        },
      },
    ]);

    return resultado;
  }

  async promedioMunicipio(municipio: string) {
    const [resultado] = await this.resultadoModel.aggregate([
      {
        $match: {
          COLE_MCPIO_UBICACION: municipio,
          PUNT_GLOBAL: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          promedio_municipio: {
            $avg: '$PUNT_GLOBAL',
          },
          total_estudiantes: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          promedio_municipio: {
            $round: ['$promedio_municipio', 2],
          },
          total_estudiantes: 1,
        },
      },
    ]);

    return (
      resultado ?? {
        promedio_municipio: 0,
        total_estudiantes: 0,
      }
    );
  }

  async desempenoPorEstrato(anio?: number, departamento?: string) {
    return this.resultadoModel.aggregate([
      {
        $match: {
          PUNT_GLOBAL: { $ne: null },
          FAMI_ESTRATOVIVIENDA: { $ne: null },
          ...(anio && { ANIO_EXAMEN: anio }),
          ...(departamento && { COLE_DEPTO_UBICACION: departamento.toUpperCase() }),
        },
      },

      {
        $addFields: {
          estrato_normalizado: {
            $toString: {
              $cond: [
                {
                  $in: ['$FAMI_ESTRATOVIVIENDA', [null, '', '0', 0, 'NULL', 'null', undefined]],
                },
                '1', 
                '$FAMI_ESTRATOVIVIENDA',
              ],
            },
          },
        },
      },

      {
        $group: {
          _id: '$estrato_normalizado',
          promedio: { $avg: '$PUNT_GLOBAL' },
          total_estudiantes: { $sum: 1 },
        },
      },

      {
        $addFields: {
          estrato_num: { $toInt: '$_id' },
        },
      },

      {
        $sort: {
          estrato_num: 1,
        },
      },

      {
        $project: {
          _id: 0,
          estrato: '$_id',
          promedio: { $round: ['$promedio', 2] },
          total_estudiantes: 1,
        },
      },
    ]);
  }

  async distribucionPorEdad(anio?: number, departamento?: string) {
    return this.resultadoModel.aggregate([
      {
        $match: {
          EDAD: { $ne: null },
          ...(anio && { ANIO_EXAMEN: anio }),
          ...(departamento && { COLE_DEPTO_UBICACION: departamento.toUpperCase() }),
        },
      },
      {
        $bucket: {
          groupBy: '$EDAD',
          boundaries: [10, 12, 14, 16, 18, 20, 22, 24, 26],
          default: '26+',
          output: {
            total: { $sum: 1 },
          },
        },
      },
      {
        $project: {
          edad: '$_id',
          total: 1,
          _id: 0,
        },
      },
      {
        $sort: { edad: 1 },
      },
    ]);
  }

  async desempenoPorEducacionPadres(anio?: number, departamento?: string) {
    const filtrosBase = {
      ...(anio && { ANIO_EXAMEN: anio }),
      ...(departamento && { COLE_DEPTO_UBICACION: departamento.toUpperCase() }),
    };

    const [madre, padre] = await Promise.all([
      this.resultadoModel.aggregate([
        {
          $match: {
            FAMI_EDUCACIONMADRE: { $ne: null },
            PUNT_GLOBAL: { $ne: null },
            ...filtrosBase,
          },
        },
        {
          $group: {
            _id: '$FAMI_EDUCACIONMADRE',
            promedio: { $avg: '$PUNT_GLOBAL' },
            total_estudiantes: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            nivel_educacion: '$_id',
            promedio: { $round: ['$promedio', 2] },
            total_estudiantes: 1,
          },
        },
      ]),
      this.resultadoModel.aggregate([
        {
          $match: {
            FAMI_EDUCACIONPADRE: { $ne: null },
            PUNT_GLOBAL: { $ne: null },
            ...filtrosBase,
          },
        },
        {
          $group: {
            _id: '$FAMI_EDUCACIONPADRE',
            promedio: { $avg: '$PUNT_GLOBAL' },
            total_estudiantes: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            nivel_educacion: '$_id',
            promedio: { $round: ['$promedio', 2] },
            total_estudiantes: 1,
          },
        },
      ]),
    ]);

    return { madre, padre };
  }

  async impactoEquipamientoHogar(anio?: number, departamento?: string) {
    const buildAgg = (field: keyof Resultado) =>
      this.resultadoModel.aggregate([
        {
          $match: {
            PUNT_GLOBAL: { $ne: null },
            [field]: 1,
            ...(anio && { ANIO_EXAMEN: anio }),
            ...(departamento && { COLE_DEPTO_UBICACION: departamento.toUpperCase() }),
          },
        },
        {
          $group: {
            _id: null,
            promedio: { $avg: '$PUNT_GLOBAL' },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            promedio: { $round: ['$promedio', 2] },
            total: 1,
          },
        },
      ]);

    const [carro, lavadora, internet, computador] = await Promise.all([
      buildAgg('FAMI_TIENEAUTOMOVIL'),
      buildAgg('FAMI_TIENELAVADORA'),
      buildAgg('FAMI_TIENEINTERNET'),
      buildAgg('FAMI_TIENECOMPUTADOR'),
    ]);

    return {
      carro: carro[0] ?? { promedio: 0, total: 0 },
      lavadora: lavadora[0] ?? { promedio: 0, total: 0 },
      internet: internet[0] ?? { promedio: 0, total: 0 },
      computador: computador[0] ?? { promedio: 0, total: 0 },
    };
  }

  async participacionPorAno(filtros: EvolucionFiltrosDto = {}, segmentar?: 'genero' | 'zona') {
    try {
      const matchBase = this.buildFiltrosMatch(filtros);

      const campoSegmento = segmentar === 'genero' ? '$ESTU_GENERO' : segmentar === 'zona' ? '$COLE_AREA_UBICACION' : null;

      const groupId = campoSegmento ? { ano: '$ANIO_EXAMEN', segmento: campoSegmento } : { ano: '$ANIO_EXAMEN' };

      const matchSegmento: Record<string, unknown> = {};
      if (campoSegmento) {
        const campoSinDolar = campoSegmento.slice(1);
        matchSegmento[campoSinDolar] = { $ne: null };
      }

      return await this.resultadoModel.aggregate([
        {
          $match: {
            ANIO_EXAMEN: { $ne: null },
            ...matchSegmento,
            ...matchBase,
          },
        },
        {
          $group: {
            _id: groupId,
            total_estudiantes: { $sum: 1 },
          },
        },
        {
          $sort: { '_id.ano': 1 },
        },
        {
          $project: {
            _id: 0,
            ano: '$_id.ano',
            total_estudiantes: 1,
            ...(campoSegmento ? { segmento: '$_id.segmento' } : {}),
          },
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException('Error al calcular la participación por año');
    }
  }


  async getEvolucionMunicipiosDepartamento(departamento: string) {
    try {
      const result = await this.resultadoModel.aggregate([
        {
          $match: {
            ESTU_DEPTO_RESIDE: departamento.toUpperCase(),
            PUNT_GLOBAL: { $ne: null },
            ESTU_MCPIO_RESIDE: { $ne: null },
            ANIO_EXAMEN: { $in: [2014, 2022] },
          },
        },
        {
          $group: {
            _id: {
              municipio: '$ESTU_MCPIO_RESIDE',
              anio: '$ANIO_EXAMEN',
            },
            promedio: { $avg: '$PUNT_GLOBAL' },
            total: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.municipio',
            datos: {
              $push: {
                anio: '$_id.anio',
                promedio: { $round: ['$promedio', 2] },
                total: '$total',
              },
            },
          },
        },
        {
          $match: {
            $expr: { $eq: [{ $size: '$datos' }, 2] },
          },
        },
        {
          $project: {
            _id: 0,
            municipio: '$_id',
            inicio: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$datos',
                    as: 'd',
                    cond: { $eq: ['$$d.anio', 2014] },
                  },
                },
                0,
              ],
            },
            fin: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$datos',
                    as: 'd',
                    cond: { $eq: ['$$d.anio', 2022] },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $addFields: {
            delta: {
              $round: [{ $subtract: ['$fin.promedio', '$inicio.promedio'] }, 2],
            },
          },
        },
        {
          $sort: { delta: -1 },
        },
      ]);

      return result;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener evolución de municipios');
    }
  }

  
  async getEvolucionMunicipiosPorAnio(departamento: string) {
  try {
    const result = await this.resultadoModel.aggregate([
      {
        $match: {
          ESTU_DEPTO_RESIDE: departamento.toUpperCase(),
          PUNT_GLOBAL: { $ne: null },
          ESTU_MCPIO_RESIDE: { $ne: null },
          ANIO_EXAMEN: { $in: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022] },
        },
      },
      {
        $group: {
          _id: {
            municipio: '$ESTU_MCPIO_RESIDE',
            anio: '$ANIO_EXAMEN',
          },
          promedio: { $avg: '$PUNT_GLOBAL' },
        },
      },
      {
        $group: {
          _id: '$_id.municipio',
          serie: {
            $push: {
              anio: '$_id.anio',
              promedio: { $round: ['$promedio', 2] },
            },
          },
        },
      },

      {
        $match: {
          $expr: {
            $and: [
              { $gt: [{ $size: '$serie' }, 0] },
              {
                $in: [
                  2014,
                  {
                    $map: {
                      input: '$serie',
                      as: 's',
                      in: '$$s.anio',
                    },
                  },
                ],
              },
              {
                $in: [
                  2022,
                  {
                    $map: {
                      input: '$serie',
                      as: 's',
                      in: '$$s.anio',
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          serie: { $sortArray: { input: '$serie', sortBy: { anio: 1 } } },
          inicio: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$serie',
                  as: 'd',
                  cond: { $eq: ['$$d.anio', 2014] },
                },
              },
              0,
            ],
          },
          fin: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$serie',
                  as: 'd',
                  cond: { $eq: ['$$d.anio', 2022] },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          delta: {
            $round: [{ $subtract: ['$fin.promedio', '$inicio.promedio'] }, 2],
          },
        },
      },
      {
        $project: {
          _id: 0,
          municipio: '$_id',
          serie: 1,
          inicio: 1,
          fin: 1,
          delta: 1,
        },
      },
      { $sort: { delta: -1 } },
    ]);

    return result;
  } catch (error) {
    throw new InternalServerErrorException('Error al obtener evolución de municipios por año');
  }
}

}
