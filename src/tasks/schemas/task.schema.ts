import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TASK_STATUSES, TaskStatus } from '../task-status';

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  title: string;

  @Prop({ type: String, trim: true, maxlength: 2000, default: '' })
  description: string;

  @Prop({
    required: true,
    type: String,
    enum: TASK_STATUSES,
    default: TaskStatus.Todo,
  })
  status: TaskStatus;

  @Prop({ type: Date, default: null })
  dueDate: Date | null;
}

export type TaskDocument = HydratedDocument<Task> & {
  createdAt: Date;
  updatedAt: Date;
};

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.index({ projectId: 1, status: 1, dueDate: 1 });
