import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

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

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Tickets API')
    .setDescription('API de gestión de tickets de estacionamiento')
    .setVersion('1.0.0')
    .addTag('tickets')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(process.env.PORT ?? 3003);
  console.log(`Tickets Service running on port ${process.env.PORT ?? 3003}`);
}

bootstrap();
