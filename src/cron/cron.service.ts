import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  ok(): string {
    return 'OK';
  }

  @Cron('*/2 * * * *')
  tick(): string {
    const body = this.ok();
    this.logger.log(body);
    return body;
  }
}
