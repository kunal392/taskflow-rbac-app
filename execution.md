# Execution Plan: Role-Based Task Management Web App

This document outlines the step-by-step execution to build the TaskFlow backend API, based on the provided project plan.

## Phase 1: Foundation
1. **Initialize Project**
   - Create the `taskflow/backend` directory structure.
   - Set up a Python virtual environment and install required packages (`fastapi`, `sqlalchemy`, `alembic`, `psycopg2-binary`, `pydantic`, `pyjwt`, `bcrypt`, `uvicorn`, `python-dotenv`).
   - Create `requirements.txt`.
2. **Configuration & Database Setup**
   - Create `.env` file for `DATABASE_URL`, `SECRET_KEY`, etc.
   - Create `app/config.py` for environment variables.
   - Create `app/database.py` for SQLAlchemy engine and session setup.
3. **Database Models**
   - Implement models in `app/models/`: `User`, `Project`, `ProjectMember`, `Task`.
   - Set up relationships (User M:N Projects via ProjectMember, Project 1:N Tasks, etc.).
4. **Database Migrations**
   - Initialize Alembic (`alembic init alembic`).
   - Configure Alembic to use the SQLAlchemy models.
   - Generate and apply the first migration.
5. **Authentication System**
   - Implement password hashing and JWT utilities in `app/utils/hashing.py` and `app/utils/auth.py`.
   - Create Pydantic schemas in `app/schemas/user.py` and `app/schemas/auth.py`.
   - Implement `/auth/register` and `/auth/login` in `app/routers/auth.py`.
   - Implement `get_current_user` dependency in `app/dependencies/auth.py`.

## Phase 2: Core APIs and RBAC
1. **RBAC Middleware**
   - Implement `require_project_role` dependency in `app/dependencies/rbac.py` to enforce 'admin' and 'member' roles.
2. **Projects API**
   - Create schemas in `app/schemas/project.py`.
   - Implement CRUD endpoints in `app/routers/projects.py`.
3. **Project Members API**
   - Create schemas in `app/schemas/project_member.py`.
   - Implement endpoints in `app/routers/members.py` to add, list, update role, and remove members.
4. **Tasks API**
   - Create schemas in `app/schemas/task.py`.
   - Implement CRUD endpoints and status update endpoint in `app/routers/tasks.py`.

## Phase 3: Dashboard & Polish
1. **Dashboard API**
   - Implement `/dashboard` endpoint in `app/routers/dashboard.py` to aggregate statistics.
2. **Main Application Entrypoint**
   - Assemble all routers in `app/main.py`.
   - Setup CORS and global exception handlers.
3. **Testing**
   - Set up `pytest` and create tests for authentication, RBAC, and core endpoints in `tests/`.

## Phase 4: Containerization
1. **Docker Setup**
   - Create `Dockerfile` for the FastAPI backend.
   - Create `docker-compose.yml` to spin up the backend and a local PostgreSQL database for development.

---
**Note:** We will proceed step-by-step, starting with Phase 1. Each step will involve creating the respective files, writing the code, and verifying it builds successfully.
