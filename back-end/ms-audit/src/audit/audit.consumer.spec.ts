import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuditConsumer } from './audit.consumer';
import { AuditService } from './audit.service';

// El consumidor real conecta a RabbitMQ en onModuleInit() -- para probar
// SOLO la lógica de validación/ack/nack del handler de mensajes (que es lo
// que de verdad importa: que un evento inválido nunca llegue a persistirse
// y un evento válido sí), se inyecta un channel falso y se llama al método
// privado consume() directamente, sin pasar por connect().
describe('AuditConsumer', () => {
  let consumer: AuditConsumer;
  let auditService: { create: jest.Mock };
  let fakeChannel: {
    assertExchange: jest.Mock;
    assertQueue: jest.Mock;
    bindQueue: jest.Mock;
    consume: jest.Mock;
    ack: jest.Mock;
    nack: jest.Mock;
  };
  let mensajeHandler: (msg: any) => Promise<void>;

  const mensaje = (contenidoObj: unknown) => ({
    content: { toString: () => JSON.stringify(contenidoObj) },
  });

  beforeEach(async () => {
    auditService = { create: jest.fn().mockResolvedValue({ id: 'evt-1' }) };

    fakeChannel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn((_queue, handler) => {
        mensajeHandler = handler;
      }),
      ack: jest.fn(),
      nack: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditConsumer,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: string) => {
              const valores: Record<string, string> = {
                RABBITMQ_HOST: 'localhost',
                RABBITMQ_PORT: '5672',
                RABBITMQ_USER: 'guest',
                RABBITMQ_PASS: 'guest',
                RABBITMQ_QUEUE: 'audit_queue',
                RABBITMQ_EXCHANGE: 'audit_exchange',
                RABBITMQ_ROUTING_KEY: 'audit.event',
              };
              return valores[key] ?? def;
            }),
          },
        },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    consumer = module.get<AuditConsumer>(AuditConsumer);
    (consumer as any).channel = fakeChannel;

    // Registra el handler de mensajes contra el channel falso (sin conectar
    // de verdad a RabbitMQ).
    await (consumer as any).consume();
  });

  it('debe registrar el binding cola/exchange/routingKey al arrancar', () => {
    expect(fakeChannel.assertExchange).toHaveBeenCalledWith(
      'audit_exchange',
      'topic',
      { durable: true },
    );
    expect(fakeChannel.bindQueue).toHaveBeenCalledWith(
      'audit_queue',
      'audit_exchange',
      'audit.event',
    );
  });

  it('debe persistir y confirmar (ack) un evento válido', async () => {
    const eventoValido = {
      servicio: 'ms-tickets',
      accion: 'CREATE',
      entidad: 'TICKET',
      ip: '127.0.0.1',
      mac: '00:1B:44:11:3A:B7',
    };

    await mensajeHandler(mensaje(eventoValido));

    expect(auditService.create).toHaveBeenCalled();
    expect(fakeChannel.ack).toHaveBeenCalled();
    expect(fakeChannel.nack).not.toHaveBeenCalled();
  });

  it('debe descartar (nack, sin reencolar) un evento con campos inválidos y no persistirlo', async () => {
    const eventoInvalido = {
      servicio: 'no-empieza-con-ms', // no matchea /^(ms-[a-zA-Z]+)$/
      accion: 'CREATE',
      entidad: 'TICKET',
      ip: '127.0.0.1',
      mac: '00:1B:44:11:3A:B7',
    };

    await mensajeHandler(mensaje(eventoInvalido));

    expect(auditService.create).not.toHaveBeenCalled();
    expect(fakeChannel.nack).toHaveBeenCalledWith(
      expect.anything(),
      false,
      false,
    );
    expect(fakeChannel.ack).not.toHaveBeenCalled();
  });

  it('debe descartar (nack) un mensaje que no es JSON válido, sin lanzar', async () => {
    const msgRoto = { content: { toString: () => 'esto no es json' } };

    await expect(mensajeHandler(msgRoto)).resolves.not.toThrow();
    expect(auditService.create).not.toHaveBeenCalled();
    expect(fakeChannel.nack).toHaveBeenCalledWith(msgRoto, false, false);
  });
});
