import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3004;
  await app.listen(port);
  console.log(`Audit Service running on port ${port}`);
}
bootstrap().catch((error) => {
  console.error('Error al iniciar ms-audit:', error);
  process.exit(1);
});
