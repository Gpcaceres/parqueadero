import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstrap de la aplicación NestJS
 * Microservicio de Asignación y Trazabilidad para Parqueadero Inteligente
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Confiar solo en saltos desde la red privada de Docker (Kong), no en toda la
  // cadena. Con `true` se confía en cualquier hop y Express toma la IP más a la
  // izquierda de X-Forwarded-For, que el cliente puede falsificar libremente
  // (Kong solo añade la IP real al final, no reemplaza el header). Además, el
  // puerto del servicio también está publicado directo al host, así que un
  // cliente podría saltarse Kong por completo; validar por rango de IP (en vez
  // de por cantidad de saltos) hace que solo se confíe en proxies dentro de la
  // red privada, sin importar cuántas entradas falsas venga en el header.
  app.getHttpAdapter().getInstance().set('trust proxy', 'loopback, uniquelocal');

  // Configurar prefijo global
  app.setGlobalPrefix('api');

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Habilitar CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configurar Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Asignación y Trazabilidad API')
    .setDescription(
      'Microservicio de gestión de asignaciones de vehículos a propietarios con auditoría integral',
    )
    .setVersion('1.0.0')
    .addTag('Asignaciones', 'Gestión de asignaciones de vehículos')
    .addTag('Auditoría', 'Registros de trazabilidad y cambios')
    .addTag('Integraciones', 'Integración con otros microservicios')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  // Puerto
  const port = process.env.PORT || 3002;

  await app.listen(port);
  console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║  Microservicio Asignación y Trazabilidad                 ║
    ║  Listening on port ${port}                                     ║
    ║  Swagger: http://localhost:${port}/swagger                  ║
    ║  Health: http://localhost:${port}/api/asignaciones/health   ║
    ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
