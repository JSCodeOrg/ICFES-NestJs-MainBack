import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Institucion, InstitucionDocument } from './institucion.schema';
import { Model } from 'mongoose';

@Injectable()
export class InstitucionService {
  constructor(
    @InjectModel(Institucion.name)
    private readonly institucionModel: Model<InstitucionDocument>,
  ) {}

  async contarInstituciones() {
    return this.institucionModel.countDocuments();
  }

  async sectorLiderPerformance() {
    const [resultado] = await this.institucionModel.aggregate([
      {
        $group: {
          _id: '$COLE_NATURALEZA',
          promedio: {
            $avg: '$promedio_global',
          },
        },
      },
      {
        $sort: {
          promedio: -1,
        },
      },
      {
        $limit: 1,
      },
      {
        $project: {
          _id: 0,
          sector: '$_id',
        },
      },
    ]);

    return resultado;
  }

  async rankingDepartamentos(page = 1, limit = 5) {
    const skip = (page - 1) * limit;

    const [resultados, total] = await Promise.all([
      this.institucionModel.aggregate([
        { $sort: { promedio_global: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            nombre_institucion: '$COLE_NOMBRE_ESTABLECIMIENTO',
            departamento: '$COLE_DEPTO_UBICACION',
            municipio: '$COLE_MCPIO_UBICACION',
            sector: '$COLE_NATURALEZA',
            promedio_global: { $round: ['$promedio_global', 2] },
            codigo_dane: '$COLE_COD_DANE_ESTABLECIMIENTO',
          },
        },
      ]),
      this.institucionModel.countDocuments(),
    ]);

    return {
      data: resultados.map((institucion, index) => ({
        rango: skip + index + 1,
        ...institucion,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async rankingDepartamento(departamento: string, municipio?: string, naturaleza?: string, page = 1, limit = 5) {
    const skip = (page - 1) * limit;

    const filtro: any = {
      COLE_DEPTO_UBICACION: departamento.toUpperCase(),
    };

    if (municipio) {
      filtro.COLE_MCPIO_UBICACION = municipio.toUpperCase();
    }

    if (naturaleza) {
      filtro.COLE_NATURALEZA = naturaleza.toUpperCase();
    }

    const [resultados, total] = await Promise.all([
      this.institucionModel.aggregate([
 
        {
          $setWindowFields: {
            sortBy: {
              promedio_global: -1,
            },

            output: {
              rango: {
                $rank: {},
              },
            },
          },
        },

        {
          $match: filtro,
        },

        {
          $skip: skip,
        },

        {
          $limit: limit,
        },

        {
          $project: {
            _id: 0,

            rango: 1,

            nombre_institucion: '$COLE_NOMBRE_ESTABLECIMIENTO',

            departamento: '$COLE_DEPTO_UBICACION',

            municipio: '$COLE_MCPIO_UBICACION',

            sector: '$COLE_NATURALEZA',

            promedio_global: {
              $round: ['$promedio_global', 2],
            },

            codigo_dane: '$COLE_COD_DANE_ESTABLECIMIENTO',
          },
        },
      ]),

      this.institucionModel.countDocuments(filtro),
    ]);

    return {
      data: resultados,

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),

        departamento: departamento.toUpperCase(),

        municipio: municipio ? municipio.toUpperCase() : null,

        naturaleza: naturaleza ? naturaleza.toUpperCase() : null,
      },
    };
  }

  async obtenerMunicipios(departamento: string): Promise<string[]> {
    const municipios = await this.institucionModel.distinct('COLE_MCPIO_UBICACION', {
      COLE_DEPTO_UBICACION: departamento.toUpperCase(),
    });

    return municipios.sort((a, b) => a.localeCompare(b));
  }

  async obtenerInstitucion(codigoDane: string) {
    const [institucion] = await this.institucionModel.aggregate([

      {
        $setWindowFields: {
          sortBy: {
            promedio_global: -1,
          },

          output: {
            rango_nacional: {
              $rank: {},
            },
          },
        },
      },

      {
        $match: {
          COLE_COD_DANE_ESTABLECIMIENTO: Number(codigoDane),
        },
      },

      {
        $addFields: {
          promedio_global: {
            $round: ['$promedio_global', 2],
          },

          promedio_lectura: {
            $round: ['$promedio_lectura', 2],
          },

          promedio_matematicas: {
            $round: ['$promedio_matematicas', 2],
          },

          promedio_naturales: {
            $round: ['$promedio_naturales', 2],
          },

          promedio_sociales: {
            $round: ['$promedio_sociales', 2],
          },

          promedio_ingles: {
            $round: ['$promedio_ingles', 2],
          },
        },
      },
    ]);

    return institucion;
  }

  async promedioSector(naturaleza: string) {
    const [resultado] = await this.institucionModel.aggregate([
      {
        $match: {
          COLE_NATURALEZA: naturaleza.toUpperCase(),
        },
      },
      {
        $group: {
          _id: '$COLE_NATURALEZA',
          promedio_sector: {
            $avg: '$promedio_global',
          },
          total_instituciones: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          sector: '$_id',
          promedio_sector: { $round: ['$promedio_sector', 2] },
          total_instituciones: 1,
        },
      },
    ]);

    return (
      resultado ?? {
        sector: naturaleza,
        promedio_sector: 0,
        total_instituciones: 0,
      }
    );
  }

  async buscarInstituciones(query: string, limit = 10) {
    const esCodigo = /^\d+$/.test(query.trim());

    const projectStage = {
      _id: 0,
      nombre_institucion: '$COLE_NOMBRE_ESTABLECIMIENTO',
      departamento: '$COLE_DEPTO_UBICACION',
      municipio: '$COLE_MCPIO_UBICACION',
      sector: '$COLE_NATURALEZA',
      promedio_global: { $round: ['$promedio_global', 2] },
      codigo_dane: '$COLE_COD_DANE_ESTABLECIMIENTO',
    };

    if (esCodigo) {
      return this.institucionModel.aggregate([
        { $match: { COLE_COD_DANE_ESTABLECIMIENTO: Number(query.trim()) } },
        { $project: projectStage },
        { $limit: limit },
      ]);
    }

    const porTexto = await this.institucionModel.aggregate([
      { $match: { $text: { $search: query } } },
      { $sort: { score: { $meta: 'textScore' } } },
      { $project: projectStage },
      { $limit: limit },
    ]);

    if (porTexto.length > 0) return porTexto;

    return this.institucionModel.aggregate([
      { $match: { COLE_NOMBRE_ESTABLECIMIENTO: new RegExp(query.trim(), 'i') } },
      { $project: projectStage },
      { $limit: limit },
    ]);
  }
}
