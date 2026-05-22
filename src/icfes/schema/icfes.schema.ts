import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'resultados' })
export class Resultado {
  /**
   * =========================
   * COLEGIO
   * =========================
   */

  @Prop()
  COLE_AREA_UBICACION: string;

  @Prop()
  COLE_BILINGUE: number;

  @Prop()
  COLE_CALENDARIO: string;

  @Prop()
  COLE_CARACTER: string;

  @Prop({ index: true })
  COLE_COD_DANE_ESTABLECIMIENTO: number;

  @Prop()
  COLE_COD_DEPTO_UBICACION: number;

  @Prop()
  COLE_COD_MCPIO_UBICACION: number;

  @Prop({ index: true })
  COLE_DEPTO_UBICACION: string;

  @Prop()
  COLE_GENERO: string;

  @Prop()
  COLE_JORNADA: string;

  @Prop({ index: true })
  COLE_MCPIO_UBICACION: string;

  @Prop({ index: true })
  COLE_NATURALEZA: string;

  @Prop({ index: 'text' })
  COLE_NOMBRE_ESTABLECIMIENTO: string;

  @Prop()
  COLE_SEDE_PRINCIPAL: string;

  /**
   * =========================
   * ESTUDIANTE
   * =========================
   */

  @Prop()
  ESTU_DEPTO_PRESENTACION: string;

  @Prop()
  ESTU_DEPTO_RESIDE: string;

  @Prop()
  ESTU_FECHANACIMIENTO: Date;

  @Prop({ index: true })
  ESTU_GENERO: string;

  @Prop()
  ESTU_MCPIO_PRESENTACION: string;

  @Prop()
  ESTU_MCPIO_RESIDE: string;

  @Prop()
  ESTU_NACIONALIDAD: string;

  @Prop()
  ESTU_PRIVADO_LIBERTAD: number;

  /**
   * =========================
   * FAMILIA
   * =========================
   */

  @Prop()
  FAMI_CUARTOSHOGAR: string;

  @Prop()
  FAMI_EDUCACIONMADRE: number;

  @Prop()
  FAMI_EDUCACIONPADRE: number;

  @Prop()
  FAMI_ESTRATOVIVIENDA: string;

  @Prop()
  FAMI_PERSONASHOGAR: string;

  @Prop()
  FAMI_TIENEAUTOMOVIL: number;

  @Prop()
  FAMI_TIENECOMPUTADOR: number;

  @Prop()
  FAMI_TIENEINTERNET: number;

  @Prop()
  FAMI_TIENELAVADORA: number;

  /**
   * =========================
   * RESULTADOS ICFES
   * =========================
   */

  @Prop()
  DESEMP_INGLES: string;

  @Prop()
  PUNT_INGLES: number;

  @Prop()
  PUNT_MATEMATICAS: number;

  @Prop()
  PUNT_SOCIALES_CIUDADANAS: number;

  @Prop()
  PUNT_C_NATURALES: number;

  @Prop()
  PUNT_LECTURA_CRITICA: number;

  @Prop({ index: true })
  PUNT_GLOBAL: number;

  @Prop({ index: true })
  ANIO_EXAMEN: number;

  @Prop()
  EDAD: number;

  @Prop()
  CAT_PUNT_GLOBAL: string;

  @Prop()
  GRUPO_EDAD: string;

  /**
   * =========================
   * REGIONES
   * =========================
   */

  @Prop()
  REGION_RESIDE: string;

  @Prop()
  REGION_PRESENTA: string;

  @Prop()
  MIGRA_REGION: boolean;
}

export const ResultadosSchema = SchemaFactory.createForClass(Resultado);

/**
 * =========================
 * ÍNDICES
 * =========================
 */

// Año + ranking
ResultadosSchema.index({
  ANIO_EXAMEN: 1,
  PUNT_GLOBAL: -1,
});

// Naturaleza + ranking
ResultadosSchema.index({
  COLE_NATURALEZA: 1,
  PUNT_GLOBAL: -1,
});

// Departamento + ranking
ResultadosSchema.index({
  COLE_DEPTO_UBICACION: 1,
  PUNT_GLOBAL: -1,
});

// Municipio + ranking
ResultadosSchema.index({
  COLE_MCPIO_UBICACION: 1,
  PUNT_GLOBAL: -1,
});

// Género + ranking
ResultadosSchema.index({
  ESTU_GENERO: 1,
  PUNT_GLOBAL: -1,
});

// Búsqueda textual
ResultadosSchema.index({
  COLE_NOMBRE_ESTABLECIMIENTO: 'text',
});

// Código DANE
ResultadosSchema.index({
  COLE_COD_DANE_ESTABLECIMIENTO: 1,
});

// Región
ResultadosSchema.index({
  REGION_RESIDE: 1,
  PUNT_GLOBAL: -1,
});
