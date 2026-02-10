from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Exercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    uses_bodyweight: bool = Field(default=False)
    body_part: str = Field(default="other", index=True)
    sub_part: str = Field(default="compound")


class WorkoutSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    bodyweight_kg: Optional[float] = None


class SetEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(index=True, foreign_key="workoutsession.id")
    exercise_id: int = Field(index=True, foreign_key="exercise.id")
    weight_kg: float
    reps: int
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FitnessGoal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type: str = Field(index=True)  # "pr" or "frequency"
    exercise_id: Optional[int] = Field(default=None, foreign_key="exercise.id")
    target_weight_kg: Optional[float] = None
    target_reps: Optional[int] = None
    target_sessions_per_week: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
