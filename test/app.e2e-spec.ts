import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

type AuthBody = {
  accessToken: string;
  user: { id: string; name: string; email: string; passwordHash?: string };
};

type ProjectBody = {
  id: string;
  title: string;
  counts: { todo: number; 'in-progress': number; done: number };
};

type TaskBody = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
};

describe('Mini Project Manager API', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongod.getUri();
    process.env.JWT_SECRET = 'test-secret-must-be-long';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.CLIENT_ORIGIN = 'http://localhost:3000';
    process.env.PORT = '3001';

    const { Test } = await import('@nestjs/testing');
    const { AppModule } = await import('../src/app.module');
    const { configureApp } = await import('../src/configure-app');
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  }, 60000);

  afterAll(async () => {
    await app?.close();
    await mongod?.stop();
  });

  async function register(email: string, name = 'Test User') {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name, email, password: 'password123' })
      .expect(201);
    return response.body as AuthBody;
  }

  it('registers, logs in, and never returns a password hash', async () => {
    const registered = await register('ada@example.com', 'Ada');
    expect(registered.accessToken).toEqual(expect.any(String));
    expect(registered.user).toEqual({
      id: expect.any(String),
      name: 'Ada',
      email: 'ada@example.com',
    });
    expect(JSON.stringify(registered)).not.toContain('passwordHash');

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${registered.accessToken}`)
      .expect(200);
    expect(me.body.email).toBe('ada@example.com');

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'Ada@Example.com', password: 'password123' })
      .expect(200);
    expect(login.body.user.email).toBe('ada@example.com');
  });

  it('rejects a duplicate email and a short password', async () => {
    await register('dup@example.com');
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'Dup', email: 'dup@example.com', password: 'password123' })
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'Short', email: 'short@example.com', password: 'short' })
      .expect(400);
  });

  it('requires a token and hides other users resources', async () => {
    await request(app.getHttpServer()).get('/api/v1/projects').expect(401);

    const owner = await register('owner@example.com', 'Owner');
    const other = await register('other@example.com', 'Other');

    const created = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Private', description: 'Mine' })
      .expect(201);
    const project = created.body as ProjectBody;

    const taskResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Secret task', status: 'todo' })
      .expect(201);
    const task = taskResponse.body as TaskBody;

    await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .send({ title: 'Stolen' })
      .expect(404);
    await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .get('/api/v1/projects/not-an-id')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(400);
  });

  it('filters, sorts, caps page size, counts tasks, and deletes with the project', async () => {
    const owner = await register('planner@example.com', 'Planner');
    const auth = { Authorization: `Bearer ${owner.accessToken}` };

    const projectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set(auth)
      .send({ title: 'Launch' })
      .expect(201);
    const project = projectResponse.body as ProjectBody;
    expect(project.counts).toEqual({ todo: 0, 'in-progress': 0, done: 0 });

    const specs = [
      { title: 'No date', status: 'todo' },
      { title: 'Old done', status: 'done', dueDate: '2020-01-01' },
      { title: 'Old open', status: 'todo', dueDate: '2020-01-02' },
      { title: 'Future', status: 'in-progress', dueDate: '2035-01-01' },
    ];
    for (const spec of specs) {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${project.id}/tasks`)
        .set(auth)
        .send(spec)
        .expect(201);
    }

    const listed = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .set(auth)
      .expect(200);
    const match = (listed.body.data as ProjectBody[]).find(
      (item) => item.id === project.id,
    );
    expect(match?.counts).toEqual({ todo: 2, 'in-progress': 1, done: 1 });

    const byDue = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks?sort=dueDate&order=asc`)
      .set(auth)
      .expect(200);
    expect((byDue.body.data as TaskBody[]).map((task) => task.title)).toEqual([
      'Old done',
      'Old open',
      'Future',
      'No date',
    ]);
    expect(byDue.body.meta).toMatchObject({ page: 1, limit: 20, total: 4 });

    const byStatus = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks?sort=status&order=asc`)
      .set(auth)
      .expect(200);
    expect(
      (byStatus.body.data as TaskBody[]).map((task) => task.title),
    ).toEqual(['Old open', 'No date', 'Future', 'Old done']);

    const overdue = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks?overdue=true`)
      .set(auth)
      .expect(200);
    expect((overdue.body.data as TaskBody[]).map((task) => task.title)).toEqual(
      ['Old open'],
    );

    const openOnly = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks?status=todo`)
      .set(auth)
      .expect(200);
    expect(openOnly.body.meta.total).toBe(2);

    await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks?limit=500`)
      .set(auth)
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${(byDue.body.data as TaskBody[])[0].id}`)
      .set(auth)
      .send({ projectId: project.id })
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${project.id}`)
      .set(auth)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .set(auth)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${(byDue.body.data as TaskBody[])[0].id}`)
      .set(auth)
      .send({ title: 'Gone' })
      .expect(404);
  });

  it('reports health', async () => {
    const health = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(health.body).toEqual({ status: 'ok', database: 'up' });
  });
});
