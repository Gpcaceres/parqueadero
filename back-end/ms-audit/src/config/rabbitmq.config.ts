import { ConfigService } from '@nestjs/config';

export const getRabbitMQConfig = (config: ConfigService) => ({
  host: config.get<string>('RABBITMQ_HOST'),
  port: +config.get<string>('RABBITMQ_PORT', '5672'),
  username: config.get<string>('RABBITMQ_USER'),
  password: config.get<string>('RABBITMQ_PASS'),
  queue: config.get<string>('RABBITMQ_QUEUE'),
  exchange: config.get<string>('RABBITMQ_EXCHANGE'),
  routingKey: config.get<string>('RABBITMQ_ROUTING_KEY'),
});
