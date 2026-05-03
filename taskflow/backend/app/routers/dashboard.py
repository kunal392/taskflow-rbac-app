from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.task import Task
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from app.dependencies.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_projects = db.query(ProjectMember.project_id).filter(ProjectMember.user_id == current_user.id).subquery()
    
    total_projects = db.query(Project).filter(Project.id.in_(user_projects)).count()
    
    tasks_query = db.query(Task).filter(Task.project_id.in_(user_projects))
    total_tasks = tasks_query.count()
    
    todo_tasks = tasks_query.filter(Task.status == "todo").count()
    in_progress_tasks = tasks_query.filter(Task.status == "in_progress").count()
    done_tasks = tasks_query.filter(Task.status == "done").count()
    
    now = datetime.now(timezone.utc)
    overdue_tasks_query = tasks_query.filter(Task.status != "done", Task.due_date < now).all()
    
    overdue_tasks = [
        {
            "id": task.id,
            "title": task.title,
            "due_date": task.due_date,
            "project_name": task.project.name,
            "days_overdue": (now - task.due_date).days if task.due_date else 0
        }
        for task in overdue_tasks_query
    ]
    
    # Simple recent activity mock (as we don't have an activity log table yet)
    recent_activity = []
    
    return {
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "tasks_by_status": {
            "todo": todo_tasks,
            "in_progress": in_progress_tasks,
            "done": done_tasks
        },
        "overdue_tasks": overdue_tasks,
        "recent_activity": recent_activity
    }
