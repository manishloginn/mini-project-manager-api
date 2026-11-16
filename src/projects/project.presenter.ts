import { ApiProperty } from '@nestjs/swagger';
import { ProjectDocument } from './schemas/project.schema';

export class TaskCountsDto {
  @ApiProperty()
  todo: number;

  @ApiProperty({ name: 'in-progress' })
  'in-progress': number;

  @ApiProperty()
  done: number;
}

export class ProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: TaskCountsDto })
  counts: TaskCountsDto;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export function emptyCounts(): TaskCountsDto {
  return { todo: 0, 'in-progress': 0, done: 0 };
}

export function toProject(
  project: ProjectDocument,
  counts: TaskCountsDto,
): ProjectResponseDto {
  return {
    id: project._id.toString(),
    title: project.title,
    description: project.description ?? '',
    counts,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
