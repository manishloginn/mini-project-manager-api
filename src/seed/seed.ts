import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { endOfUtcDay } from '../common/utils/dates';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { demoUsers } from './demo-data';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const users = app.get<Model<UserDocument>>(getModelToken(User.name));
  const projects = app.get<Model<ProjectDocument>>(getModelToken(Project.name));
  const tasks = app.get<Model<TaskDocument>>(getModelToken(Task.name));

  for (const demo of demoUsers) {
    const passwordHash = await bcrypt.hash(demo.password, 10);
    const user = await users.findOneAndUpdate(
      { email: demo.email },
      { name: demo.name, email: demo.email, passwordHash },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    if (!user) {
      throw new Error(`Could not upsert ${demo.email}`);
    }

    const existing = await projects.find({ ownerId: user._id });
    await tasks.deleteMany({
      projectId: { $in: existing.map((project) => project._id) },
    });
    await projects.deleteMany({ ownerId: user._id });

    for (const project of demo.projects) {
      const created = await projects.create({
        title: project.title,
        description: project.description,
        ownerId: user._id,
      });
      if (project.tasks.length > 0) {
        await tasks.insertMany(
          project.tasks.map((task) => ({
            projectId: created._id,
            title: task.title,
            description: task.description,
            status: task.status,
            dueDate: task.dueDate ? endOfUtcDay(task.dueDate) : null,
          })),
        );
      }
    }
  }

  await app.close();
  console.log('Seeded demo users ava@demo.com and noah@demo.com');
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
