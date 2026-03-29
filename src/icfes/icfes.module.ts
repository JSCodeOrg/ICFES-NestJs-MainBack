import { Module } from '@nestjs/common';
import { IcfesService } from './icfes.service';
import { IcfesController } from './icfes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Resultado, ResultadosSchema } from './schema/icfes.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Resultado.name, schema: ResultadosSchema}
    ])
  ],
  controllers: [IcfesController],
  providers: [IcfesService],
})
export class IcfesModule {}
