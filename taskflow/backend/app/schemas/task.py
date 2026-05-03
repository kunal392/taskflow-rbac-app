from pydantic import BaseModel, Field, computed_field
from datetime import datetime
from typing import Optional
from app.schemas.user import UserOut

class TaskBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    status: str = Field("todo", pattern="^(todo|in_progress|done)$")
    priority: str = Field("medium", pattern="^(low|medium|high)$")
    due_date: Optional[datetime] = None
    assignee_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    status: Optional[str] = Field(None, pattern="^(todo|in_progress|done)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")

class TaskStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(todo|in_progress|done)$")

class TaskOut(TaskBase):
    id: int
    project_id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    assignee: Optional[UserOut] = None
    creator: UserOut

    class Config:
        from_attributes = True

    @computed_field
    def is_overdue(self) -> bool:
        if self.status != "done" and self.due_date:
            from datetime import timezone
            now = datetime.now(timezone.utc)
            if self.due_date.tzinfo is None:
                return self.due_date < datetime.now()
            return self.due_date < now
        return False
