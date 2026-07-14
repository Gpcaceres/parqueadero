import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Tickets Microservice is running!';
  }

  health() {
    return {
      status: 'ok',
      service: 'ms-tickets',
      timestamp: new Date().toISOString(),
    };
  }
}
