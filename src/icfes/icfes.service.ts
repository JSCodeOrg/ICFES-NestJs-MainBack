import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Resultado } from './schema/icfes.schema';
import { Model } from 'mongoose';
import { PromedioAnualDto } from './dto/promedioAnualDto';

@Injectable()
export class IcfesService {
  constructor(
    @InjectModel(Resultado.name)
    private readonly resultadoModel: Model<Resultado>,
  ) { }

  async distribucionGenero() {
    try {
      return this.resultadoModel.aggregate([
        {
          $group: {
            _id: '$ESTU_GENERO',
            cantidad: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$cantidad' },
            data: {
              $push: {
                genero: '$_id',
                cantidad: '$cantidad',
              },
            },
          },
        },
        {
          $unwind: '$data',
        },
        {
          $project: {
            _id: 0,
            genero: '$data.genero',
            cantidad: '$data.cantidad',
            porcentaje: {
              $multiply: [{ $divide: ['$data.cantidad', '$total'] }, 100],
            },
          },
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
            _id: '$COLE_NATURALEZA',
            promedio: { $avg: '$PUNT_GLOBAL' },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            tipo_colegio: '$_id',
            promedio: 1,
            total: 1,
          },
        },
        {
          $sort: {
            tipo_colegio: 1,
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
          _id: '$ESTU_DEPTO_RESIDE', // 👈 agrupamos por departamento
          promedio: { $avg: '$PUNT_GLOBAL' }, // 👈 calculamos promedio
          total_estudiantes: { $sum: 1 }, // (extra útil)
        },
      },
      {
        $sort: { promedio: -1 }, // 👈 opcional: ordenar de mayor a menor
      },
      {
        $project: {
          _id: 0,
          departamento: '$_id',
          promedio: { $round: ['$promedio', 2] }, // redondear (opcional)
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
          _id: '$COLE_AREA_UBICACION', // 👈 agrupación por zona
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
          _id: '$ESTU_MCPIO_RESIDE', // 👈 agrupamos por municipio
          promedio: { $avg: '$PUNT_GLOBAL' },
          total_estudiantes: { $sum: 1 },
        },
      },
      {
        $sort: { promedio: -1 }, // 👈 de mayor a menor
      },
      {
        $limit: 15, // 👈 TOP 15
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
          _id: '$EDAD', // 👈 agrupamos por edad
          promedio: { $avg: '$PUNT_GLOBAL' },
          total_estudiantes: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }, // 👈 ordenar por edad (ascendente)
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
}
