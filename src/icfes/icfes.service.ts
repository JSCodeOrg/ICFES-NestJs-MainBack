import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Resultado } from './schema/icfes.schema';
import { Model } from 'mongoose';

@Injectable()
export class IcfesService {
  constructor(
    @InjectModel(Resultado.name)
    private readonly resultadoModel: Model<Resultado>,
  ) {}

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
}
