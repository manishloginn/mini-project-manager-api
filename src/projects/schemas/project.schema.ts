import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Project {
  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  title: string;

  @Prop({ type: String, trim: true, maxlength: 2000, default: '' })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;
}

export type ProjectDocument = HydratedDocument<Project> & {
  createdAt: Date;
  updatedAt: Date;
};

export const ProjectSchema = SchemaFactory.createForClass(Project);
