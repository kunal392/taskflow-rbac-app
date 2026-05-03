# TaskFlow - Role-Based Task Management Application

TaskFlow is a modern, full-stack web application designed for seamless project collaboration with strict Role-Based Access Control (RBAC). It ensures that teams can manage tasks effectively while keeping administrative actions secure.

## 🎯 What is it?
TaskFlow allows users to create projects, invite team members, and track tasks (Todo, In Progress, Done). The application relies heavily on **RBAC** to distinguish between standard `Members`, `Managers`, and `Admins`. 

* **Standard Members:** Can view projects, view tasks, update statuses of tasks they are assigned to.
* **Managers:** Can create tasks, invite new members to a project.
* **Admins:** Have full control, including the ability to delete projects and assign/remove other admins.

## 🤔 Why was it built?
In many productivity applications, access control is an afterthought. TaskFlow was built to demonstrate a **security-first architecture** where role validation is handled natively at the API level via dependencies, rather than just hiding buttons on the frontend. It guarantees that even if a malicious user tries to bypass the UI, the backend will reject unauthorized actions.

## ⚙️ How it works
The system is split into two decoupled architectures:
1. **The Backend Engine (FastAPI):** A high-performance REST API that handles database interactions, password hashing, JWT token generation, and RBAC validation.
2. **The Frontend Client (React):** A fast, single-page application (SPA) that consumes the API and provides a responsive, beautifully styled user interface following modern UX principles.

---

## 🛠️ Tech Stack

### Backend
* **[FastAPI](https://fastapi.tiangolo.com/):** Chosen for its incredible performance, automatic Swagger UI documentation, and async capabilities.
* **[SQLAlchemy](https://www.sqlalchemy.org/):** The Object-Relational Mapper (ORM) used to interact with the database using Python objects instead of raw SQL strings.
* **[Pydantic](https://docs.pydantic.dev/):** Used for strict data validation (e.g., ensuring passwords are long enough, emails are valid, and due dates are formatted properly).
* **[SQLite](https://www.sqlite.org/):** A lightweight, file-based database for simple local development and persistent storage.
* **[Alembic](https://alembic.sqlalchemy.org/):** Handles database migrations (schema changes) seamlessly over time.
* **[Docker](https://www.docker.com/):** Containerizes the backend so it runs consistently across any machine without "it works on my machine" issues.

### Frontend
* **[React 18](https://react.dev/) + [Vite](https://vitejs.dev/):** Vite provides near-instant server starts and lightning-fast Hot Module Replacement (HMR) for React development.
* **[React Router DOM](https://reactrouter.com/):** Manages client-side routing, enabling the creation of Protected Routes that redirect unauthorized users to the login page.
* **Vanilla CSS (ui-ux-pro-max guidelines):** No heavy CSS frameworks (like Bootstrap or Tailwind) are used. The app is styled using a deeply customized, modern CSS variable system featuring glassmorphism, 4.5:1 WCAG contrast ratios, and fluid micro-animations.
* **[Lucide React](https://lucide.dev/):** A beautiful, consistent, open-source icon library.

---

## 🚀 Running the Project Locally

### 1. Start the Backend (Docker Required)
The backend is containerized for your convenience. From the root of the project:
```bash
cd taskflow
docker-compose up --build -d
```
*The API will be available at `http://localhost:8000`*
*Interactive API Docs (Swagger) will be available at `http://localhost:8000/docs`*

### 2. Start the Frontend (Node.js Required)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The web app will be available at `http://localhost:5173`*

---

## 💡 Key Features Implemented
* **JWT Authentication:** Secure login/registration flow.
* **Dynamic Overdue Tracking:** The API dynamically computes if a task is overdue based on the current UTC time, and the frontend renders bold `[OVERDUE]` badges.
* **Smart UI Rendering:** The React UI intelligently reads the logged-in user's role and physically hides administrative actions (like the "Delete Project" button) from standard users.
* **Global Error Handling:** API utility interceptors automatically catch `401 Unauthorized` responses and log the user out cleanly if their session expires.
