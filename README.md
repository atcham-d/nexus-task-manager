# Nexus Task Manager

A full-stack task management app I built as part of a backend internship assignment. The goal was to design a secure, scalable REST API with authentication and role-based access — and wire it up to a working frontend.

I used Node.js + Express on the backend with PostgreSQL, and React on the frontend. Auth is handled with JWTs (access + refresh token rotation), and I added Google OAuth on top of that so users have both options.

---

## Tech Stack

**Backend** — Node.js, Express, PostgreSQL, JWT, Bcrypt, Passport.js, Winston, Swagger  
**Frontend** — React 18, Vite, Tailwind CSS, Recharts, React Router v6  
**Infrastructure** — Docker, Docker Compose, Nginx

---

## Features

- Register and login with email/password or Google OAuth
- JWT access tokens with refresh token rotation
- Role-based access — regular users manage their own tasks, admins see everything
- Full task CRUD with status, priority, due dates, search, and pagination
- Admin dashboard with user management and platform stats
- XSS sanitization and input validation on every route
- Rate limiting on auth endpoints
- Structured logging with Winston
- Interactive API docs at `/api-docs` (Swagger UI)
- Dockerized — runs with a single command

---

## Getting Started

**Prerequisites:** Docker Desktop

```bash
git clone https://github.com/yourusername/nexus-task-manager.git
cd nexus-task-manager

cp backend/.env.example backend/.env
# Open backend/.env and set JWT_SECRET and JWT_REFRESH_SECRET to any long random strings

docker compose up --build
```

First run takes a few minutes. Once you see `Server running on port 5000`, run the migration:

```bash
docker compose exec backend node src/config/migrate.js
```

Then open:

| | URL |
|---|---|
| App | http://localhost:3000 |
| API | http://localhost:5000 |
| Docs | http://localhost:5000/api-docs |

Default admin login: `admin@nexus.ai` / `Admin@123456`

---

## Running Without Docker

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in your DB credentials
node src/config/migrate.js
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## API Overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh | Refresh token |
| POST | /api/v1/auth/logout | Logout |
| GET | /api/v1/auth/me | Current user |
| GET | /api/v1/auth/google | Google OAuth |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/tasks | List (paginated, filterable) |
| POST | /api/v1/tasks | Create |
| GET | /api/v1/tasks/:id | Get one |
| PATCH | /api/v1/tasks/:id | Update |
| DELETE | /api/v1/tasks/:id | Delete |
| GET | /api/v1/tasks/stats | Stats |

### Admin only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/users | List users |
| PATCH | /api/v1/users/:id | Update user |
| DELETE | /api/v1/users/:id | Delete user |
| GET | /api/v1/users/dashboard | Platform stats |

Full interactive docs at `/api-docs`.

---

## Environment Variables

```env
PORT=5000
DB_HOST=localhost
DB_NAME=nexus_db
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
FRONTEND_URL=http://localhost:3000

# Optional — for Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
BACKEND_URL=http://localhost:5000
```

---

## Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:5000/api/v1/auth/google/callback`
4. Copy the client ID and secret into `backend/.env`

---

## Running Tests

```bash
cd backend && npm test
```

Covers auth flows, task CRUD, role enforcement, and OAuth route behaviour.

---

## Project Structure

```
nexus-task-manager/
├── backend/
│   ├── src/
│   │   ├── config/        # DB, logger, passport, migration
│   │   ├── controllers/   # Auth, tasks, users
│   │   ├── middleware/    # JWT, RBAC, validation, rate limiting
│   │   ├── routes/        # Express routers with Swagger annotations
│   │   ├── validators/    # Input validation rules
│   │   └── utils/         # JWT helpers, response formatters
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/    # Layout, BackgroundBoxes
│       ├── context/       # Auth state
│       ├── pages/         # Login, Register, Dashboard, Tasks, Admin
│       └── services/      # Axios + API layer
└── docker-compose.yml
```

---

## Scalability

See [scalability-note.md](./scalability-note.md) for notes on horizontal scaling, connection pooling, Redis caching, and a microservices migration path.