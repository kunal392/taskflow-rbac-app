from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, projects, members, tasks, dashboard

app = FastAPI(title="TaskFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(members.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to TaskFlow API"}
