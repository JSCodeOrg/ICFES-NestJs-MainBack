import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Resultado } from './schema/icfes.schema';
import { Model } from 'mongoose';
import { PromedioAnualDto } from './dto/promedioAnualDto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class IcfesService {
  constructor(
    @InjectModel(Resultado.name)
    private readonly resultadoModel: Model<Resultado>,
    private readonly cacheService: CacheService,
  ) { }

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
                          $divide: [
                            { $ifNull: ['$$match.cantidad', 0] },
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
  async promedioNacional() {
    try {
      return this.resultadoModel.aggregate([
        {
          $match: {
            PUNT_GLOBAL: { $ne: null },
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

  async comparacionColegios() {
    try {
      return this.resultadoModel.aggregate([
        {
          $match: {
            COLE_NATURALEZA: { $in: ['OFICIAL', 'NO OFICIAL'] },
            PUNT_GLOBAL: { $ne: null },
          },
        },
        {
          $group: {
            _id: {
              tipo: '$COLE_NATURALEZA',
              anio: '$ANIO_EXAMEN',
            },
            promedio: { $avg: '$PUNT_GLOBAL' },
          },
        },
        {
          $project: {
            _id: 0,
            tipo: '$_id.tipo',
            key: { $toString: '$_id.anio' },
            value: { $round: ['$promedio', 1] },
          },
        },
        {
          $group: {
            _id: '$tipo',
            data: {
              $push: {
                key: '$key',
                value: '$value',
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
      throw new InternalServerErrorException(error);
    }
  }

  async promedioDepartamentos() {

    return this.resultadoModel.aggregate([
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
        $project: {
          _id: 0,
          departamento: '$_id',
          promedio: { $round: ['$promedio', 2] },
          total_estudiantes: 1,
        },
      },
    ]);
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

  async promedioPorEdad() {
    return this.resultadoModel.aggregate([
      {
        $match: {
          EDAD: { $ne: null },
          PUNT_GLOBAL: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$EDAD',
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
          edad: '$_id',
          promedio: { $round: ['$promedio', 2] },
          total_estudiantes: 1,
        },
      },
    ]);
  }

  async promedioPorAno() {
    return await this.resultadoModel.aggregate([
      {
        $match: {
          PUNT_GLOBAL: { $ne: null },
          ANIO_EXAMEN: { $ne: null },
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
            _id: "$ANIO_EXAMEN",
            promedio: { $avg: "$PUNT_GLOBAL" },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id",
            promedio: { $round: ["$promedio", 2] },
          },
        },
        {
          $sort: { year: 1 },
        },
      ]);

      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        "Error al obtener el promedio histórico del departamento"
      );
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

  async getTopMunicipiosPorDepartamento(
    departamento: string,
    limit: number
  ) {
    try {
      const result = this.resultadoModel.aggregate([
        {
          $match: {
            ESTU_DEPTO_RESIDE: departamento.toUpperCase(),
          },
        },
        {
          $group: {
            _id: "$ESTU_MCPIO_RESIDE",
            promedio: { $avg: "$PUNT_GLOBAL" },
          },
        },
        {
          $project: {
            _id: 0,
            municipio: "$_id",
            promedio: { $round: ["$promedio", 2] },
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
      throw new InternalServerErrorException(
        "Error al obtener el top de municipios"
      );
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
            _id: "$ESTU_MCPIO_RESIDE",
            promedio: { $avg: "$PUNT_GLOBAL" },
          },
        },
        {
          $project: {
            _id: 0,
            municipio: "$_id",
            promedio: { $round: ["$promedio", 2] },
          },
        },
        {
          $sort: { promedio: 1 }, // 🔴 CLAVE: ascendente = bottom
        },
        {
          $limit: limit,
        },
      ]);

      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        "Error al obtener el bottom de municipios del departamento"
      );
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
            _id: "$ESTU_MCPIO_RESIDE",
            promedio: { $avg: "$PUNT_GLOBAL" },
            total_estudiantes: { $sum: 1 },
            desviacion: { $stdDevPop: "$PUNT_GLOBAL" },
          },
        },
        {
          $project: {
            _id: 0,
            municipio: "$_id",
            promedio: { $round: ["$promedio", 2] },
            total_estudiantes: 1,
            desviacion: { $round: ["$desviacion", 2] },
          },
        },
        {
          $sort: { promedio: -1 },
        },
      ]);

      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        "Error al obtener métricas de municipios"
      );
    }
  }
}
