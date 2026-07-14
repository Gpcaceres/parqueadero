import { Global, Module } from '@nestjs/common';
import { EventPublisher } from './event-publisher.service';

// Global para que tanto PersonasModule (UsersService) como AuthModule
// (AuthService) puedan inyectar EventPublisher sin que cada uno tenga que
// registrarlo por separado.
@Global()
@Module({
  providers: [EventPublisher],
  exports: [EventPublisher],
})
export class EventPublisherModule {}
