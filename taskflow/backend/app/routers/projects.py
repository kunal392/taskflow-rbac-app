from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.dependencies.rbac import require_admin, require_member

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)

@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(project: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_project = Project(**project.model_dump(), owner_id=current_user.id)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Add caller as an admin
    member = ProjectMember(project_id=new_project.id, user_id=current_user.id, role="admin")
    db.add(member)
    db.commit()

    return new_project

@router.get("", response_model=List[ProjectOut])
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = db.query(Project).join(ProjectMember).filter(ProjectMember.user_id == current_user.id).all()
    return projects

@router.get("/{id}", response_model=ProjectOut)
def get_project(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_member())):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{id}", response_model=ProjectOut)
def update_project(id: int, project_update: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin())):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for key, value in project_update.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin())):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
