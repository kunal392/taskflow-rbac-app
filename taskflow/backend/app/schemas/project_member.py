from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.user import UserOut

class ProjectMemberBase(BaseModel):
    role: str = Field(..., pattern="^(admin|member)$")

class ProjectMemberCreate(ProjectMemberBase):
    user_id: int

class ProjectMemberUpdate(ProjectMemberBase):
    pass

class ProjectMemberOut(ProjectMemberBase):
    id: int
    project_id: int
    user_id: int
    joined_at: datetime
    user: UserOut

    class Config:
        from_attributes = True
