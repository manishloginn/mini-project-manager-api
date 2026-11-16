import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { pageOf } from '../common/dto/pagination-query.dto';
import { endOfUtcDay } from '../common/utils/dates';
import { OwnershipService } from '../ownership/ownership.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskDocument } from './schemas/task.schema';
import { TaskShape, toTask } from './task.presenter';
import { TaskStatus } from './task-status';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly ownership: OwnershipService,
  ) {}

  async list(userId: string, projectId: string, query: ListTasksQueryDto) {
    await this.ownership.getProject(projectId, userId);
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);

    if (query.overdue && query.status === TaskStatus.Done) {
      return pageOf([], { page, limit, total: 0 });
    }

    const match: Record<string, unknown> = {
      projectId: new Types.ObjectId(projectId),
    };
    if (query.overdue) {
      match.dueDate = { $lt: new Date() };
      match.status = query.status ?? { $ne: TaskStatus.Done };
    } else if (query.status) {
      match.status = query.status;
    }

    const direction = query.order === 'desc' ? -1 : 1;
    const sort: Record<string, 1 | -1> =
      query.sort === 'status'
        ? { statusRank: direction, hasDue: -1, dueDate: 1 }
        : { hasDue: -1, dueDate: direction };

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $addFields: {
          hasDue: { $cond: [{ $ifNull: ['$dueDate', false] }, 1, 0] },
          statusRank: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', TaskStatus.Todo] }, then: 0 },
                { case: { $eq: ['$status', TaskStatus.InProgress] }, then: 1 },
                { case: { $eq: ['$status', TaskStatus.Done] }, then: 2 },
              ],
              default: 3,
            },
          },
        },
      },
      { $sort: sort },
    ];

    const [countRows, tasks] = await Promise.all([
      this.taskModel.aggregate<{ total: number }>([
        ...pipeline,
        { $count: 'total' },
      ]),
      this.taskModel.aggregate<TaskShape>([
        ...pipeline,
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    return pageOf(
      tasks.map((task) => toTask(task)),
      {
        page,
        limit,
        total: countRows[0]?.total ?? 0,
      },
    );
  }

  async create(userId: string, projectId: string, dto: CreateTaskDto) {
    const project = await this.ownership.getProject(projectId, userId);
    const task = await this.taskModel.create({
      projectId: project._id,
      title: dto.title,
      description: dto.description ?? '',
      status: dto.status ?? TaskStatus.Todo,
      dueDate: this.parseDueDate(dto.dueDate),
    });
    return toTask(task);
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.ownership.getTask(taskId, userId);
    if (dto.title !== undefined) {
      task.title = dto.title;
    }
    if (dto.description !== undefined) {
      task.description = dto.description;
    }
    if (dto.status !== undefined) {
      task.status = dto.status;
    }
    if (dto.dueDate !== undefined) {
      task.dueDate = this.parseDueDate(dto.dueDate);
    }
    await task.save();
    return toTask(task);
  }

  async remove(userId: string, taskId: string) {
    const task = await this.ownership.getTask(taskId, userId);
    await this.taskModel.deleteOne({ _id: task._id });
    return { deleted: true };
  }

  private parseDueDate(value: string | null | undefined) {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    return endOfUtcDay(value);
  }
}
