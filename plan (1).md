# 📋 Project Plan: Role-Based Task Management Web App

> **Stack:** Python (FastAPI) · PostgreSQL · React (or Jinja2) · JWT Auth · Docker · Railway/Render deployment

---

## 1. Project Overview

A multi-tenant project management web app where Admins create projects, manage teams, and assign tasks, while Members view and update their assigned work. The system enforces role-based access at every API layer.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Backend** | FastAPI (Python) | Async, auto docs (Swagger), fast to build |
| **Database** | PostgreSQL | Relational, great for RBAC & foreign keys |
| **ORM** | SQLAlchemy + Alembic | Migrations, relationship management |
| **Auth** | JWT (PyJWT) + bcrypt | Stateless, secure password hashing |
| **Frontend** | React + Tailwind CSS | Or Jinja2 templates if minimal frontend |
| **Deployment** | Railway / Render + Neon (Postgres) | Free tiers, easy CI/CD |
| **Containerization** | Docker + Docker Compose | Local parity, easy deploy |

---

## 3. Database Schema

### Tables & Relationships

```
users
  id (PK), name, email (unique), password_hash, created_at

projects
  id (PK), name, description, owner_id (FK → users), created_at

project_members          ← junction table (M:N)
  id (PK), project_id (FK → projects), user_id (FK → users),
  role (ENUM: admin | member), joined_at

tasks
  id (PK), title, description, status (ENUM: todo | in_progress | done),
  priority (ENUM: low | medium | high),
  project_id (FK → projects), assignee_id (FK → users, nullable),
  created_by (FK → users), due_date, created_at, updated_at
```

### Key Relationships
- A **User** can be a member of many **Projects** (via `project_members`)
- A **Project** has many **Tasks**
- A **Task** belongs to one **Project** and optionally one **User** (assignee)
- Each `project_members` row carries a `role` — the RBAC pivot

---

## 4. Folder Structure

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app entry
│   │   ├── config.py             # Settings (env vars)
│   │   ├── database.py           # SQLAlchemy engine & session
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── task.py
│   │   │   └── project_member.py
│   │   ├── schemas/              # Pydantic request/response models
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── task.py
│   │   │   └── auth.py
│   │   ├── routers/
│   │   │   ├── auth.py           # /auth/register, /auth/login
│   │   │   ├── projects.py       # /projects CRUD
│   │   │   ├── tasks.py          # /tasks CRUD
│   │   │   ├── members.py        # /projects/{id}/members
│   │   │   └── dashboard.py      # /dashboard summary
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── project_service.py
│   │   │   └── task_service.py
│   │   ├── dependencies/
│   │   │   ├── auth.py           # get_current_user
│   │   │   └── rbac.py           # require_project_admin, require_member
│   │   └── utils/
│   │       └── hashing.py
│   ├── alembic/                  # DB migrations
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                     # React app (optional)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/                  # Axios service layer
│   │   └── context/              # Auth context
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 5. REST API Design

### Auth — `/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Create account |
| POST | `/auth/login` | Public | Returns JWT access token |
| GET | `/auth/me` | Authenticated | Current user profile |

### Projects — `/projects`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/projects` | Authenticated | Create project (caller becomes Admin) |
| GET | `/projects` | Authenticated | List all projects user belongs to |
| GET | `/projects/{id}` | Member+ | Get project details |
| PUT | `/projects/{id}` | Admin | Update project |
| DELETE | `/projects/{id}` | Admin | Delete project |

### Members — `/projects/{id}/members`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/projects/{id}/members` | Admin | Add member (with role) |
| GET | `/projects/{id}/members` | Member+ | List project members |
| PUT | `/projects/{id}/members/{uid}` | Admin | Change member role |
| DELETE | `/projects/{id}/members/{uid}` | Admin | Remove member |

### Tasks — `/projects/{id}/tasks`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/projects/{id}/tasks` | Admin | Create task |
| GET | `/projects/{id}/tasks` | Member+ | List tasks (filter by status/assignee) |
| GET | `/projects/{id}/tasks/{tid}` | Member+ | Task detail |
| PUT | `/projects/{id}/tasks/{tid}` | Admin or Assignee | Update task |
| PATCH | `/projects/{id}/tasks/{tid}/status` | Assignee | Update status only |
| DELETE | `/projects/{id}/tasks/{tid}` | Admin | Delete task |

### Dashboard — `/dashboard`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard` | Authenticated | Summary: task counts, overdue, recent activity |

---

## 6. Role-Based Access Control (RBAC)

### Roles

| Role | Scope | Permissions |
|------|-------|-------------|
| **Admin** | Per-project | Full CRUD on project, tasks, members |
| **Member** | Per-project | View project & tasks; update own task status |

### Implementation Pattern

```python
# dependencies/rbac.py

def require_project_role(required_role: str):
    def dependency(
        project_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        membership = db.query(ProjectMember).filter_by(
            project_id=project_id, user_id=current_user.id
        ).first()

        if not membership:
            raise HTTPException(403, "Not a project member")

        if required_role == "admin" and membership.role != "admin":
            raise HTTPException(403, "Admin access required")

        return current_user
    return dependency

# Usage in router:
@router.delete("/{id}", dependencies=[Depends(require_project_role("admin"))])
```

---

## 7. Authentication Flow

```
1. POST /auth/register  →  hash password (bcrypt)  →  save user
2. POST /auth/login     →  verify password  →  return JWT (24h expiry)
3. All protected routes  →  Authorization: Bearer <token>
                         →  get_current_user() decodes JWT  →  loads user
4. RBAC layer           →  checks project_members table for role
```

**JWT Payload:**
```json
{ "sub": "user_id", "email": "user@example.com", "exp": 1234567890 }
```

---

## 8. Validation Rules

### Users
- Email: valid format, unique
- Password: min 8 chars, bcrypt hashed (never stored plain)
- Name: 2–100 chars, required

### Projects
- Name: 3–100 chars, required
- Description: optional, max 500 chars

### Tasks
- Title: 3–150 chars, required
- Status: must be one of `todo | in_progress | done`
- Priority: must be one of `low | medium | high`
- Due date: optional, must be a future date on creation
- Assignee: must be a member of the project

### Members
- Role: must be `admin` or `member`
- Cannot remove the last admin from a project

---

## 9. Dashboard API Response

```json
GET /dashboard

{
  "total_projects": 4,
  "total_tasks": 23,
  "tasks_by_status": {
    "todo": 8,
    "in_progress": 10,
    "done": 5
  },
  "overdue_tasks": [
    {
      "id": 12,
      "title": "Fix login bug",
      "due_date": "2024-12-01",
      "project_name": "Backend API",
      "days_overdue": 3
    }
  ],
  "recent_activity": [
    { "action": "task_updated", "task": "Deploy pipeline", "by": "Alice", "at": "2025-01-10T14:22:00Z" }
  ]
}
```

---

## 10. Development Phases

### Phase 1 — Foundation (Days 1–3)
- [ ] Set up FastAPI project, virtual environment, folder structure
- [ ] Configure PostgreSQL + SQLAlchemy + Alembic
- [ ] Create all models and run initial migration
- [ ] Implement `/auth/register` and `/auth/login` with JWT
- [ ] Add `get_current_user` dependency

### Phase 2 — Core APIs (Days 4–7)
- [ ] Projects CRUD (create, list, get, update, delete)
- [ ] Project members management (add, list, change role, remove)
- [ ] RBAC middleware (`require_project_role`)
- [ ] Tasks CRUD with RBAC enforcement
- [ ] Task status update endpoint (member-level access)

### Phase 3 — Dashboard & Polish (Days 8–9)
- [ ] Dashboard summary endpoint with overdue detection
- [ ] Query filters (tasks by status, assignee, due date)
- [ ] Proper error responses (404, 403, 422)
- [ ] Pydantic validation on all endpoints
- [ ] Write unit + integration tests (pytest)

### Phase 4 — Frontend (Days 10–12) *(optional — can use Swagger UI)*
- [ ] Auth pages (Login / Register)
- [ ] Projects list + detail pages
- [ ] Task board (Kanban by status columns)
- [ ] Dashboard page with stats

### Phase 5 — Deployment (Days 13–14)
- [ ] Dockerfile for backend
- [ ] docker-compose.yml (backend + postgres)
- [ ] `.env` configuration (DATABASE_URL, SECRET_KEY)
- [ ] Deploy to Railway or Render
- [ ] Provision Neon PostgreSQL (or Railway Postgres plugin)
- [ ] Set environment variables in dashboard
- [ ] Verify Swagger docs live at `/docs`

---

## 11. Environment Variables

```env
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Production extras
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-frontend.com
```

---

## 12. Deployment Architecture

```
User Browser
     │
     ▼
[Render / Railway]        ← Hosts FastAPI container
     │
     ├── FastAPI App       ← Uvicorn ASGI server
     │       │
     │       └── SQLAlchemy ORM
     │               │
     ▼               ▼
[Neon / Railway Postgres]  ← Managed PostgreSQL
```

**Deployment steps (Railway):**
1. Push repo to GitHub
2. Connect repo in Railway → auto-detect Dockerfile
3. Add PostgreSQL plugin → Railway injects `DATABASE_URL`
4. Set `SECRET_KEY` in Variables tab
5. Deploy → live URL in seconds

---

## 13. Key Python Packages

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
pydantic[email]==2.7.1
pyjwt==2.8.0
bcrypt==4.1.3
python-multipart==0.0.9
pytest==8.2.0
httpx==0.27.0          # For test client
python-dotenv==1.0.1
```

---

## 14. Testing Strategy

| Type | Tool | Covers |
|------|------|--------|
| Unit | pytest | Service functions, RBAC logic |
| Integration | pytest + httpx TestClient | Full API request/response |
| Auth | pytest | JWT generation, expiry, invalid tokens |
| RBAC | pytest | Admin vs Member permissions per endpoint |

**Example test cases:**
- Member cannot create a task → expect `403`
- Assigning a task to a non-member → expect `400`
- Overdue tasks appear in dashboard correctly
- Admin can change member role; member cannot

---

## 15. Success Criteria

- [ ] All REST endpoints return correct status codes and JSON
- [ ] Admins and Members see different capabilities on the same project
- [ ] JWT tokens expire and are validated on every request
- [ ] Database constraints prevent orphaned tasks/members
- [ ] App is live on a public URL with Swagger docs accessible
- [ ] At least 80% test coverage on core routes
