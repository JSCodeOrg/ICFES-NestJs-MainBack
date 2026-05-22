import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConsultaRapida, ConsultaRapidaSchema } from 'src/cache/schema/cache_consultas';
import { HistoricoInstitucion, HistoricoInstitucionSchema, Institucion, InstitucionesSchema } from './institucion.schema';
import { InstitucionController } from './institucion.controller';
import { InstitucionService } from './institucion.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Institucion.name, schema: InstitucionesSchema }])],
  controllers: [InstitucionController],
  providers: [InstitucionService],
})
export class InstitucionModule {}
