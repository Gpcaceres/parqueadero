import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from './audit.service';
import * as amqp from 'amqplib';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';
import { getRabbitMQConfig } from '../config/rabbitmq.config';

@Injectable()
export class AuditConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditConsumer.name);
  private connection: any;
  private channel: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.connectAndConsume();
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // conexión ya cerrada o nunca establecida: no hay nada que limpiar
    }
  }

  // Conecta y arranca el consumo como una sola operación: si cualquiera de
  // los dos pasos falla (incluida una conexión que se cae después), se
  // reintenta el ciclo completo, para no quedar con una conexión viva pero
  // sin consumidor enganchado a la cola.
  private async connectAndConsume() {
    try {
      await this.connect();
      await this.consume();
    } catch (error) {
      this.logger.error(`Error conectando/consumiendo de RabbitMQ: ${error}`);
      setTimeout(() => this.connectAndConsume(), 5000);
    }
  }

  private async connect() {
    const { host, port, username, password } = getRabbitMQConfig(
      this.configService,
    );
    const url = `amqp://${username}:${password}@${host}:${port}`;

    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    this.logger.log(`Connected to RabbitMQ at ${host}:${port}`);

    this.connection.on('close', () => {
      this.logger.warn('Conexión a RabbitMQ cerrada, intentando reconectar...');
      this.channel = null;
      this.connection = null;
      this.connectAndConsume();
    });

    this.connection.on('error', (err: any) => {
      this.logger.error(`Error en conexión RabbitMQ: ${err.message}`);
    });
  }

  private async consume() {
    const { queue, exchange, routingKey } = getRabbitMQConfig(
      this.configService,
    );

    try {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, exchange, routingKey);

      this.channel.consume(
        queue,
        async (msg: amqp.ConsumeMessage | null) => {
          if (msg) {
            const content = msg.content.toString();
            this.logger.debug(`Mensaje recibido: ${content}`);
            try {
              const raw = JSON.parse(content);
              const dto = plainToInstance(CreateAuditEventDto, raw);
              const errors = await validate(dto);

              if (Array.isArray(errors) && errors.length > 0) {
                const errorMessages = errors.map((e: ValidationError) =>
                  Object.values(e.constraints || {}).join(', '),
                );
                this.logger.warn(`DTO inválido: ${errorMessages.join('; ')}`);
                // Rechazar el mensaje y no reencolar (para evitar bucles)
                this.channel.nack(msg, false, false);
                return;
              }

              // Guardar el evento de auditoría
              await this.auditService.create(dto);
              this.logger.debug('Evento de auditoría guardado exitosamente');
              this.channel.ack(msg);
            } catch (err) {
              const errorMessage =
                err instanceof Error ? err.message : 'Error desconocido';
              this.logger.error(`Error procesando mensaje: ${errorMessage}`);
              // Rechazar el mensaje y no reencolar
              this.channel.nack(msg, false, false);
            }
          }
        },
        { noAck: false },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error configurando consumidor: ${errorMessage}`);
      throw error;
    }
  }
}
