from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.project_member import ProjectMemberCreate, ProjectMemberUpdate, ProjectMemberOut
from app.models.project_member import ProjectMember
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.dependencies.rbac import require_admin, require_member

router = APIRouter(
    prefix="/projects/{id}/members",
    tags=["Members"]
)

@router.post("", response_model=ProjectMemberOut, status_code=status.HTTP_201_CREATED)
def add_member(id: int, member: ProjectMemberCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin())):
    user = db.query(User).filter(User.id == member.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing = db.query(ProjectMember).filter(ProjectMember.project_id == id, ProjectMember.user_id == member.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")
        
    new_member = ProjectMember(project_id=id, user_id=member.user_id, role=member.role)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.get("", response_model=List[ProjectMemberOut])
def get_members(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_member())):
    members = db.query(ProjectMember).filter(ProjectMember.project_id == id).all()
    return members

@router.put("/{uid}", response_model=ProjectMemberOut)
def update_member_role(id: int, uid: int, member_update: ProjectMemberUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin())):
    member = db.query(ProjectMember).filter(ProjectMember.project_id == id, ProjectMember.user_id == uid).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if member.role == "admin" and member_update.role != "admin":
        # Ensure they aren't the last admin
        admin_count = db.query(ProjectMember).filter(ProjectMember.project_id == id, ProjectMember.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot change role of the last admin")

    member.role = member_update.role
    db.commit()
    db.refresh(member)
    return member

@router.delete("/{uid}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(id: int, uid: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin())):
    member = db.query(ProjectMember).filter(ProjectMember.project_id == id, ProjectMember.user_id == uid).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.role == "admin":
        admin_count = db.query(ProjectMember).filter(ProjectMember.project_id == id, ProjectMember.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the last admin")

    db.delete(member)
    db.commit()
