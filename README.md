# Mini Project Manager API

NestJS REST API for one user's projects and tasks. JWT auth, MongoDB, and Swagger.

## Setup

```bash
cp .env.example .env
npm install
npm run seed
npm run start:dev
```

The API listens on `http://localhost:3001`. Interactive docs: `http://localhost:3001/api/docs`. Health: `GET /api/v1/health`.

### Demo login

`npm run seed` creates two accounts and replaces their projects each time it runs.

- Email: `ava@demo.com`
- Password: `Demo1234`

## Production

```bash
npm install
npm run build
npm run start:prod
```

Set these environment variables on the host. The process will not boot if `MONGODB_URI`, `JWT_SECRET`, or `CLIENT_ORIGIN` is missing.

- `PORT` — API port. Hosts often inject this.
- `MONGODB_URI` — MongoDB connection string, including the database name
- `JWT_SECRET` — at least 16 characters
- `JWT_EXPIRES_IN` — for example `1h`
- `CLIENT_ORIGIN` — exact browser origin of the frontend, for CORS
- `AUTH_THROTTLE_TTL_MS` and `AUTH_THROTTLE_LIMIT` — login and register limit

After the first deploy, run `npm run seed` once against that database if you want the demo account.

## API

Resource routes are under `/api/v1`. Send `Authorization: Bearer <accessToken>` except for register, login, and health.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Create an account and return a token |
| POST | `/api/v1/auth/login` | Return a token |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/health` | Process and database status |
| GET | `/api/v1/cron` | Returns `OK`. The same check also runs every 2 minutes inside the API process |
| GET, POST | `/api/v1/projects` | List or create projects |
| GET, PATCH, DELETE | `/api/v1/projects/:id` | One project |
| GET, POST | `/api/v1/projects/:projectId/tasks` | List or create tasks |
| PATCH, DELETE | `/api/v1/tasks/:id` | Update or delete a task |

List responses look like `{ data, meta: { page, limit, total } }`. `limit` defaults to 20 and cannot exceed 100.

Task list query: `status`, `overdue=true`, `sort=dueDate|status`, `order=asc|desc`, `page`, `limit`.

## Design decisions

The owner id always comes from the JWT, never from the client. A project or task that belongs to someone else returns 404, the same as a missing id. Passwords are bcrypt hashes and are never returned. Deleting a project deletes its tasks first. On a standalone MongoDB server those two writes are not a transaction.

Team sharing, comments, a drag-and-drop board, refresh-token cookies, Redis, and queues are intentionally left out.
