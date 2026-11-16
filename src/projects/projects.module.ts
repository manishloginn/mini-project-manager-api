import { Module } from '@nestjs/common';
import { OwnershipModule } from '../ownership/ownership.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [OwnershipModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
