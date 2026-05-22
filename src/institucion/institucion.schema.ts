import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InstitucionDocument = HydratedDocument<Institucion>;

@Schema({ _id: false })
export class HistoricoInstitucion {
  @Prop({ required: true })
  anio: number;

  @Prop({ required: true })
  promedio_global: number;

  @Prop({ required: true })
  promedio_lectura: number;

  @Prop({ required: true })
  promedio_matematicas: number;

  @Prop({ required: true })
  promedio_naturales: number;

  @Prop({ required: true })
  promedio_sociales: number;

  @Prop({ required: true })
  promedio_ingles: number;

  @Prop({ required: true })
  total_estudiantes: number;
}

export const HistoricoInstitucionSchema = SchemaFactory.createForClass(HistoricoInstitucion);

@Schema({
  collection: 'instituciones',
  timestamps: true,
})
export class Institucion {
  @Prop({
    required: true,
    unique: true,
  })
  COLE_COD_DANE_ESTABLECIMIENTO: number;

  @Prop({
    required: true,
  })
  COLE_NOMBRE_ESTABLECIMIENTO: string;

  @Prop({
    required: true,
  })
  COLE_DEPTO_UBICACION: string;

  @Prop({
    required: true,
  })
  COLE_MCPIO_UBICACION: string;

  @Prop({
    required: true,
  })
  COLE_NATURALEZA: string;

  @Prop({
    required: true,
  })
  COLE_AREA_UBICACION: string;

  @Prop({
    required: true,
  })
  promedio_global: number;

  @Prop({ required: true })
  promedio_lectura: number;

  @Prop({ required: true })
  promedio_matematicas: number;

  @Prop({ required: true })
  promedio_naturales: number;

  @Prop({ required: true })
  promedio_sociales: number;

  @Prop({ required: true })
  promedio_ingles: number;

  @Prop({
    required: true,
  })
  total_estudiantes: number;

  @Prop({
    type: [HistoricoInstitucionSchema],
    default: [],
  })
  historico: HistoricoInstitucion[];
}

export const InstitucionesSchema = SchemaFactory.createForClass(Institucion);

/**
 * =========================
 * ÍNDICES
 * =========================
 */

// Ranking global
InstitucionesSchema.index({
  promedio_global: -1,
});

// Departamento + ranking
InstitucionesSchema.index({
  COLE_DEPTO_UBICACION: 1,
  promedio_global: -1,
});

// Municipio + ranking
InstitucionesSchema.index({
  COLE_MCPIO_UBICACION: 1,
  promedio_global: -1,
});

// Búsqueda textual
InstitucionesSchema.index({
  COLE_NOMBRE_ESTABLECIMIENTO: 'text',
});
