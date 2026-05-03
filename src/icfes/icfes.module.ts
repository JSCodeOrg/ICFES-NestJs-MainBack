import { Module } from '@nestjs/common';
import { IcfesService } from './icfes.service';
import { IcfesController } from './icfes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Resultado, ResultadosSchema } from './schema/icfes.schema';
import { CacheService } from 'src/cache/cache.service';
import { ConsultaRapida, ConsultaRapidaSchema } from 'src/cache/schema/cache_consultas';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Resultado.name, schema: ResultadosSchema}, {name: ConsultaRapida.name, schema: ConsultaRapidaSchema}
    ])
  ],
  controllers: [IcfesController],
  providers: [IcfesService, CacheService],
})
export class IcfesModule {}
