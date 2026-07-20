import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  live() {
    return this.health.live();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  ready() {
    return this.health.ready();
  }
}
