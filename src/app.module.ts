import { Inject, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { IcfesModule } from './icfes/icfes.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        //uri: configService.get<string>('MONGO_URL') 
         uri: `${configService.get<string>('MONGO_URL')}/app_db?authSource=admin`, // <-- Unifiqué ambas bases de datos, antes estaba como usuarios, ahora está como app_db y debe tener las conexiones
                                                                                  // Para poder que funcione deben insertar los datos del ETL en la url de la misma bd
      }),
    }),
    AuthModule,
    UserModule,
    IcfesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
