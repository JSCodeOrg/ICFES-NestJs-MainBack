import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // Este es el nombre y versión de la API para que se vea en swagger
  const config = new DocumentBuilder()
    .setTitle('ICFES BI-Dashboard Backend')
    .setDescription('ICFES BI-Dashboard main backend')
    .setVersion('1.0')
    .build();

  // Este es el llamado de Swagger para que escuche en localhost:3000/api
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Este es un globalPipe para poder usar Class-validator de forma global para validar entradas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  app.useGlobalGuards(app.get('JwtAuthGuard'));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
