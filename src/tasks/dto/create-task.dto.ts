import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { trimString } from '../../common/utils/trim';
import { TaskStatus } from '../task-status';

export class CreateTaskDto {
  @ApiProperty({ example: 'Rewrite homepage', maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: TaskStatus, default: TaskStatus.Todo })
  @Transform(({ value }: { value: unknown }) => value ?? TaskStatus.Todo)
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiPropertyOptional({ nullable: true, example: '2026-12-01' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsDateString()
  dueDate?: string | null;
}
