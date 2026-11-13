# Sweety: Blood Glucose Tracker

Sweety is a small web app for people with diabetes and their doctors.

- **Patients** log up to 4 blood glucose readings a day: fasting, after breakfast, after lunch and after dinner. They can see daily, month-to-date and monthly reports with charts, and set reading reminders.
- **Doctors** get read-only access to the reports and readings of the patients assigned to them.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, TanStack Router (file-based), Tailwind CSS v4, Recharts |
| Backend | Node.js, Express 5 (JavaScript, CommonJS) |
| Database | PostgreSQL: hosted on Supabase, or local in Docker behind PostgREST |
| Cache | Redis (optional), which caches built reports and clears them when a reading changes |
| Auth | JWT (`jsonwebtoken`) and `bcrypt` |

## Project structure

```
.
├── backend/            Express API (routes → controllers → services)
├── frontend/           React app (src/routes = pages)
├── docker/postgres/    Schema and roles for the Docker database (run on first start)
├── seeding-scripts/    Mock data for the Docker database
├── docker-compose.yml  Full stack: postgres, postgrest, redis, backend, frontend
└── .env.example        Settings for docker compose
```

There are two ways to run Sweety: with Docker, or locally against Supabase.

## Option 1: Run everything with Docker

You only need Docker Desktop. Postgres, PostgREST, Redis, the API and the web app all run in containers.

```sh
cp .env.example .env          # PowerShell: copy .env.example .env
```

Open `.env` and fill in two values:

- `POSTGRES_PASSWORD`: use letters and digits only, because it is also used inside a connection URL.
- `JWT_SECRET`: a long random string. You can make one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

Then start the stack and load the mock data:

```sh
docker compose up -d --build

# optional: load mock doctors, patients and about 90 days of readings
.\seeding-scripts\seed.ps1          # PowerShell
sh seeding-scripts/seed.sh          # Git Bash / Linux / macOS
```

| Service | URL |
|---|---|
| Web app | http://localhost:8088 |
| API | http://localhost:3000 |
| Postgres | `localhost:5432`, database `sweety`, user `sweety` (bound to 127.0.0.1) |

PostgREST and Redis are reachable only inside the Docker network.

**Mock accounts** (after seeding) all use the password `Password@123`:

| Role | Account |
|---|---|
| Doctor | `ananya.mehta@sweety.test` |
| Doctor | `vikram.rao@sweety.test` |
| Patient | `rahul.sharma@sweety.test` |
| Patient | `arjun.verma@sweety.test` |

[seeding-scripts/README.md](seeding-scripts/README.md) lists all the accounts.

**Images used.** These are the smallest official images:

| Service | Image |
|---|---|
| postgres | `postgres:17-alpine` |
| postgrest | `postgrest/postgrest:v12.2.12` |
| redis | `redis:7-alpine` |
| backend | built on `node:22-alpine` |
| frontend | built with Node, served by `nginx:alpine` |

**Useful commands**

```sh
docker compose ps                 # status and health
docker compose logs -f backend    # follow API logs
docker compose down               # stop (data is kept)
docker compose down -v            # stop and delete the database volume
docker compose up -d --build backend   # rebuild after backend changes
```

**Notes**

- **The schema is created only once.** [docker/postgres/](docker/postgres/) runs only the first time the `postgres-data` volume is created. After changing the schema, run `docker compose down -v` (this deletes the data) and start again.
- **Ports.** The web app, API and Postgres ports can be changed in `.env` with `FRONTEND_PORT`, `BACKEND_PORT` and `POSTGRES_PORT`. The API URL is built into the frontend, so rebuild it after changing `BACKEND_PORT`.
- **Port 3000 conflict.** Stop the stack before running the backend locally on port 3000, or set a different `BACKEND_PORT`.
- **How the backend reaches the database.** It talks to Postgres through PostgREST, the same REST layer Supabase uses. When `POSTGREST_URL` is set, `backend/src/config/supabase.js` connects to the container. Otherwise it connects to Supabase, so the application code is the same in both modes.

## Option 2: Run locally against Supabase

You need Node.js 22+, a Supabase project with the Sweety tables (see [docker/postgres/01-schema.sql](docker/postgres/01-schema.sql)) and, optionally, Redis.

**Backend**

```sh
cd backend
cp .env.example .env    # fill SUPABASE_URL, SUPABASE_SECRET_KEY, JWT_SECRET (REDIS_URL optional)
npm install
npm run dev             # http://localhost:3000
```

**Frontend**

```sh
cd frontend
cp .env.example .env    # VITE_API_URL=http://localhost:3000
npm install
npm run dev             # http://localhost:5173
```

Keep `SUPABASE_SECRET_KEY` and `JWT_SECRET` in the backend only. Never put them in the frontend.

## Environment variables

**Backend** (`backend/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 3000) |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Hosted database (server-only key) |
| `POSTGREST_URL` | Use a PostgREST server instead of Supabase (set automatically in Docker) |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Token signing and expiry (default `7d`) |
| `DEFAULT_TIMEZONE` | Fallback for "today" when the browser sends no time zone |
| `REDIS_URL`, `REPORTS_CACHE_TTL_SECONDS` | Report cache (off when `REDIS_URL` is empty) |
| `FRONTEND_URL` | Allowed CORS origins, comma-separated |

**Frontend** (`frontend/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL |

## API overview

All endpoints return `{ success, message?, data? }`.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET` and `PUT /api/auth/me`, `PUT /api/auth/password` |
| Readings (patients) | `GET` and `POST /api/readings`, `GET`, `PUT` and `DELETE /api/readings/:id`, `GET /api/readings/slots` |
| Reports (patients) | `GET /api/reports?date=`, plus `/daily`, `/month-to-date`, `/monthly`, and `POST /api/reports/reset-cache` |
| Doctor | `GET /api/doctor/list` (public), `GET /api/doctor/patients`, `GET /api/doctor/patients/:id`, plus that patient's `/reports`, `/readings` and `POST /reports/reset-cache` |

## Scripts

| Where | Command | What it does |
|---|---|---|
| backend | `npm run dev` | API with auto-reload (nodemon) |
| backend | `npm start` | API without auto-reload |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | Production build into `dist/` |
| frontend | `npm run lint` | ESLint |
