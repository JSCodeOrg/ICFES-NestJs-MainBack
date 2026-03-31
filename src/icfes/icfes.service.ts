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
      const anosvalidos = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022]
      const { ano } = dto;

      if(!anosvalidos.includes(ano)){
        throw new BadRequestException('El año solicitado no está contenido dentro del intérvalo 2014-2022')
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
}
