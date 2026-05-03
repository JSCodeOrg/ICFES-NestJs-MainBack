import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConsultaRapida } from './schema/cache_consultas';

@Injectable()
export class CacheService {
    constructor(
        @InjectModel(ConsultaRapida.name)
        private readonly cacheModel: Model<ConsultaRapida>,
    ) { }

    private serialize(params: any): string {
        return JSON.stringify(params ?? {});
    }

    async get(tipo: string, params: any = {}) {
        return this.cacheModel.findOne({
            tipo,
            params: this.serialize(params),
        });
    }

    async set(tipo: string, params: any, resultado: any) {
        return this.cacheModel.findOneAndUpdate(
            {
                tipo,
                params: this.serialize(params),
            },
            {
                resultado,
            },
            {
                upsert: true,
                new: true,
            },
        );
    }

    async remember<T>(tipo: string, params: any, fn: () => Promise<T>): Promise<T> {
        const cache = await this.get(tipo, params);
        if (cache) return cache.resultado;

        const resultado = await fn();
        await this.set(tipo, params, resultado);
        return resultado;
    }
}