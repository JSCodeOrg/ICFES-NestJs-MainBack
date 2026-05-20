import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'consultas_rapidas', timestamps: true })
export class ConsultaRapida {

    @Prop({ required: true })
    tipo: string;
    // Ej: "promedio_anual", "top_municipios"

    @Prop({ required: true })
    params: string;
    // JSON serializado: '{"ano":2022}'

    @Prop({ type: Object, required: true })
    resultado: any;
    // un JSON

}

export const ConsultaRapidaSchema = SchemaFactory.createForClass(ConsultaRapida);

ConsultaRapidaSchema.index({ tipo: 1, params: 1 }, { unique: true });