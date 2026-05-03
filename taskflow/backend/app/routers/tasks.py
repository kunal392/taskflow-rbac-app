from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, TaskStatusUpdate
from app.models.task import Task
from app.models.project_member import ProjectMember
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.dependencies.rbac import require_admin, require_member, require_project_role

router = APIRouter(
    prefix="/projects/{id}/tasks",
    tags=["Tasks"]
)

@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(id: int, task: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin())):
    if task.assignee_id:
        member = db.query(ProjectMember).filter(ProjectMember.project_id == id, ProjectMember.user_id == task.assignee_id).first()
        if not member:
            raise HTTPException(status_code=400, detail="Assignee must be a project member")

    new_task = Task(**task.model_dump(), project_id=id, created_by=current_user.id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("", response_model=List[TaskOut])
def get_tasks(id: int, status: Optional[str] = None, assignee_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(require_member())):
    query = db.query(Task).filter(Task.project_id == id)
    if status:
        query = query.filter(Task.status == status)
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    return query.all()

@router.get("/{tid}", response_model=TaskOut)
def get_task(id: int, tid: int, db: Session = Depends(get_db), current_user: User = Depends(require_member())):
    task = db.query(Task).filter(Task.project_id == id, Task.id == tid).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{tid}", response_model=TaskOut)
def update_task(id: int, tid: int, task_update: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.project_id == id, Task.id == tid).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check if admin OR assignee
    member = db.query(ProjectMember).filter(ProjectMember.project_id == id, ProjectMember.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a project member")
        
    if member.role != "admin" and task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Must be admin or task assignee to update task")

    for key, value in task_update.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    
    db.commit()
    db.refresh(task)
    return task

@router.patch("/{tid}/status", response_model=TaskOut)
def update_task_status(id: int, tid: int, status_update: TaskStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.project_id == id, Task.id == tid).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    member = db.query(ProjectMember).filter(ProjectMember.project_id == id, ProjectMember.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a project member")

    if member.role != "admin" and task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Must be admin or task assignee to update status")

    task.status = status_update.status
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{tid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(id: int, tid: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin())):
    task = db.query(Task).filter(Task.project_id == id, Task.id == tid).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
