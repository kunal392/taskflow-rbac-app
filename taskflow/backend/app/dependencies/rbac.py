from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project_member import ProjectMember
from app.dependencies.auth import get_current_user

def require_project_role(required_role: str):
    def dependency(
        id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        membership = db.query(ProjectMember).filter(
            ProjectMember.project_id == id,
            ProjectMember.user_id == current_user.id
        ).first()

        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")

        if required_role == "admin" and membership.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

        return current_user
    return dependency

def require_member():
    return require_project_role("member")

def require_admin():
    return require_project_role("admin")
