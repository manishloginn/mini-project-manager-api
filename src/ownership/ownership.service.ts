import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';

@Injectable()
export class OwnershipService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  async getProject(
    projectId: string,
    userId: string,
  ): Promise<ProjectDocument> {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      ownerId: new Types.ObjectId(userId),
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async getTask(taskId: string, userId: string): Promise<TaskDocument> {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    const project = await this.projectModel.findOne({
      _id: task.projectId,
      ownerId: new Types.ObjectId(userId),
    });
    if (!project) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }
}
