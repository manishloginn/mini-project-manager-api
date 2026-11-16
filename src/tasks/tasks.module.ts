import { Module } from '@nestjs/common';
import { OwnershipModule } from '../ownership/ownership.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [OwnershipModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
