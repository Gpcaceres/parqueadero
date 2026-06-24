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
