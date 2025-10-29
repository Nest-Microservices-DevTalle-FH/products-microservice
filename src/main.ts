import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

/**
 * Función de arranque del microservicio
 * Configura el microservicio con transporte TCP
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Crear microservicio (no es servidor HTTP)
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP, // Usar TCP para comunicación
      options: {
        port: envs.port,
      },
    },
  );

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no permitidas
    }),
  );

  await app.listen();
  logger.log(`Products Microservice running on port: ${envs.port}`);
}
bootstrap();
