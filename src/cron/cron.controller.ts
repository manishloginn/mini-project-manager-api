import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CronService } from './cron.service';

@ApiTags('cron')
@Controller('cron')
export class CronController {
  constructor(private readonly cron: CronService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  @ApiOkResponse({ schema: { example: 'OK' } })
  run(): string {
    return this.cron.ok();
  }
}
