import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { pageOf } from '../common/dto/pagination-query.dto';
import { OwnershipService } from '../ownership/ownership.service';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { TaskStatus } from '../tasks/task-status';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { emptyCounts, TaskCountsDto, toProject } from './project.presenter';
import { Project, ProjectDocument } from './schemas/project.schema';

type CountRow = {
  _id: { projectId: Types.ObjectId; status: TaskStatus };
  count: number;
};

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly ownership: OwnershipService,
  ) {}

  async list(userId: string, pageInput: number, limitInput: number) {
    const page = pageInput || 1;
    const limit = Math.min(limitInput || 20, 100);
    const filter = { ownerId: new Types.ObjectId(userId) };
    const [total, projects] = await Promise.all([
      this.projectModel.countDocuments(filter),
      this.projectModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    const counts = await this.countsFor(projects.map((project) => project._id));
    return pageOf(
      projects.map((project) =>
        toProject(project, counts.get(project._id.toString()) ?? emptyCounts()),
      ),
      { page, limit, total },
    );
  }

  async get(userId: string, projectId: string) {
    const project = await this.ownership.getProject(projectId, userId);
    const counts = await this.countsFor([project._id]);
    return toProject(
      project,
      counts.get(project._id.toString()) ?? emptyCounts(),
    );
  }

  async create(userId: string, dto: CreateProjectDto) {
    const project = await this.projectModel.create({
      title: dto.title,
      description: dto.description ?? '',
      ownerId: new Types.ObjectId(userId),
    });
    return toProject(project, emptyCounts());
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.ownership.getProject(projectId, userId);
    if (dto.title !== undefined) {
      project.title = dto.title;
    }
    if (dto.description !== undefined) {
      project.description = dto.description;
    }
    await project.save();
    const counts = await this.countsFor([project._id]);
    return toProject(
      project,
      counts.get(project._id.toString()) ?? emptyCounts(),
    );
  }

  async remove(userId: string, projectId: string) {
    const project = await this.ownership.getProject(projectId, userId);
    await this.taskModel.deleteMany({ projectId: project._id });
    await this.projectModel.deleteOne({ _id: project._id });
    return { deleted: true };
  }

  private async countsFor(ids: Types.ObjectId[]) {
    const map = new Map<string, TaskCountsDto>();
    for (const id of ids) {
      map.set(id.toString(), emptyCounts());
    }
    if (ids.length === 0) {
      return map;
    }

    const rows = await this.taskModel.aggregate<CountRow>([
      { $match: { projectId: { $in: ids } } },
      {
        $group: {
          _id: { projectId: '$projectId', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    for (const row of rows) {
      const bucket = map.get(row._id.projectId.toString());
      if (!bucket) {
        continue;
      }
      if (
        row._id.status === TaskStatus.Todo ||
        row._id.status === TaskStatus.InProgress ||
        row._id.status === TaskStatus.Done
      ) {
        bucket[row._id.status] = row.count;
      }
    }
    return map;
  }
}
