import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sin esto, los decoradores de class-validator en CreateVehiculoDto
  // (@IsIn, @Matches, @ValidateNested/@IsDefined en "datos"...) nunca se
  // ejecutan -- un "datos" ausente pasaba crudo hasta el servicio, que
  // lanzaba un TypeError no capturado (500) en vez de un 400 con mensaje
  // claro (ver INFORME_PRUEBAS.md, defecto D1). "transform: true" también es
  // obligatorio aquí: sin él, class-transformer nunca instancia AutoDto/
  // MotocicletaDto/CamionetaDto según "tipo", y @ValidateNested no tiene
  // nada que validar.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Confiar solo en saltos desde la red privada de Docker (Kong), no en toda la
  // cadena. Con `true` se confía en cualquier hop y Express toma la IP más a la
  // izquierda de X-Forwarded-For, que el cliente puede falsificar libremente
  // (Kong solo añade la IP real al final, no reemplaza el header). Además, el
  // puerto del servicio también está publicado directo al host, así que un
  // cliente podría saltarse Kong por completo; validar por rango de IP (en vez
  // de por cantidad de saltos) hace que solo se confíe en proxies dentro de la
  // red privada, sin importar cuántas entradas falsas venga en el header.
  app.getHttpAdapter().getInstance().set('trust proxy', 'loopback, uniquelocal');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Vehículos API')
    .setDescription('API de gestión de vehículos')
    .setVersion('1.0.0')
    .addTag('vehiculos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
