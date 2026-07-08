import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SeedService } from './auth/seeds/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Personas API')
    .setDescription('API de gestión de personas y usuarios con autenticación JWT')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('personas')
    .addTag('auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  // Seed roles y permisos
  const seedService = app.get(SeedService);
  await seedService.seedRolesAndPermissions();

  await app.listen(process.env.PORT ?? 3001);
  console.log(`✅ Personas Service running on port ${process.env.PORT ?? 3001}`);
}
bootstrap();
