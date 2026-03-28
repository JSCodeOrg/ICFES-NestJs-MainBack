import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


@Schema({ collection: 'resultados' })
export class Resultado {
    @Prop() COLE_AREA_UBICACION: string;
    @Prop() COLE_BILINGUE: number;
    @Prop() COLE_CALENDARIO: string;
    @Prop() COLE_CARACTER: string;
    @Prop() COLE_DEPTO_UBICACION: string;
    @Prop() COLE_GENERO: string;
    @Prop() COLE_JORNADA: string;
    @Prop() COLE_MCPIO_UBICACION: string;
    @Prop() COLE_NATURALEZA: string;
    @Prop() COLE_SEDE_PRINCIPAL: string;

    @Prop() ESTU_DEPTO_PRESENTACION: string;
    @Prop() ESTU_DEPTO_RESIDE: string;
    @Prop() ESTU_FECHANACIMIENTO: Date;
    @Prop() ESTU_GENERO: string;
    @Prop() ESTU_MCPIO_PRESENTACION: string;
    @Prop() ESTU_MCPIO_RESIDE: string;
    @Prop() ESTU_NACIONALIDAD: string;
    @Prop() ESTU_PRIVADO_LIBERTAD: number;

    @Prop() FAMI_CUARTOSHOGAR: string;
    @Prop() FAMI_EDUCACIONMADRE: number;
    @Prop() FAMI_EDUCACIONPADRE: number;
    @Prop() FAMI_ESTRATOVIVIENDA: string;
    @Prop() FAMI_PERSONASHOGAR: string;
    @Prop() FAMI_TIENEAUTOMOVIL: number;
    @Prop() FAMI_TIENECOMPUTADOR: number;
    @Prop() FAMI_TIENEINTERNET: number;
    @Prop() FAMI_TIENELAVADORA: number;

    @Prop() PUNT_GLOBAL: number;
    @Prop() ANIO_EXAMEN: number;
    @Prop() EDAD: number;
    @Prop() CAT_PUNT_GLOBAL: string;
    @Prop() GRUPO_EDAD: string;

    @Prop() REGION_RESIDE: string;
    @Prop() REGION_PRESENTA: string;
    @Prop() MIGRA_REGION: boolean;
}

export const ResultadosSchema = SchemaFactory.createForClass(Resultado);