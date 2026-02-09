from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete
from sqlmodel import Session, select

from .db import init_db, get_session
from .models import Exercise, WorkoutSession, SetEntry, FitnessGoal
from .seed import seed_exercises

app = FastAPI(title="Gym App API", version="0.1.0")

# For local/dev simplicity; tighten later if you want.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    # Seed exercises once
    from .db import engine
    with Session(engine) as db:
        seed_exercises(db)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/")
def root():
    return {"ok": True, "docs": "/docs", "health": "/health"}

@app.get("/exercises", response_model=List[Exercise])
def list_exercises(db: Session = Depends(get_session)):
    return db.exec(select(Exercise).order_by(Exercise.name)).all()

from pydantic import BaseModel

class SessionStartIn(BaseModel):
    bodyweight_kg: Optional[float] = None

class SessionOut(BaseModel):
    id: int
    started_at: datetime
    ended_at: Optional[datetime]
    bodyweight_kg: Optional[float]
    sets: int

class EntryOut(BaseModel):
    id: int
    session_id: int
    exercise_id: int
    exercise_name: str
    weight_kg: float
    reps: int
    created_at: datetime
    total_kg: float

@app.post("/sessions/start", response_model=WorkoutSession)
def start_session(payload: SessionStartIn | None = None, db: Session = Depends(get_session)):
    bodyweight = payload.bodyweight_kg if payload else None
    s = WorkoutSession(bodyweight_kg=bodyweight)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@app.get("/sessions", response_model=List[SessionOut])
def list_sessions(db: Session = Depends(get_session)):
    sessions = db.exec(select(WorkoutSession).order_by(WorkoutSession.started_at.desc())).all()
    counts = {}
    for row in db.exec(select(SetEntry.session_id)).all():
        if isinstance(row, tuple):
            session_id = row[0]
        elif hasattr(row, "session_id"):
            session_id = row.session_id
        else:
            session_id = int(row)
        counts[session_id] = counts.get(session_id, 0) + 1
    out: List[SessionOut] = []
    for s in sessions:
        out.append(
            SessionOut(
                id=s.id,
                started_at=s.started_at,
                ended_at=s.ended_at,
                bodyweight_kg=s.bodyweight_kg,
                sets=counts.get(s.id, 0),
            )
        )
    return out

@app.get("/sessions/{session_id}", response_model=WorkoutSession)
def get_session(session_id: int, db: Session = Depends(get_session)):
    s = db.get(WorkoutSession, session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    return s

class BodyweightIn(BaseModel):
    bodyweight_kg: float

@app.post("/sessions/{session_id}/bodyweight", response_model=WorkoutSession)
def set_bodyweight(session_id: int, payload: BodyweightIn, db: Session = Depends(get_session)):
    s = db.get(WorkoutSession, session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    s.bodyweight_kg = float(payload.bodyweight_kg)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@app.post("/sessions/{session_id}/end", response_model=WorkoutSession)
def end_session(session_id: int, db: Session = Depends(get_session)):
    s = db.get(WorkoutSession, session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    if s.ended_at is None:
        s.ended_at = datetime.utcnow()
        db.add(s)
        db.commit()
        db.refresh(s)
    return s

class SetEntryIn(BaseModel):
    exercise_id: int
    weight_kg: float
    reps: int

def total_load(entry: SetEntry, ex: Exercise | None, session: WorkoutSession | None) -> float:
    total = float(entry.weight_kg)
    if ex and ex.uses_bodyweight and session and session.bodyweight_kg is not None:
        total += float(session.bodyweight_kg)
    return total

@app.post("/sessions/{session_id}/entries", response_model=SetEntry)
def add_entry(session_id: int, payload: SetEntryIn, db: Session = Depends(get_session)):
    s = db.get(WorkoutSession, session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    if s.ended_at is not None:
        raise HTTPException(400, "Session already ended")

    ex = db.get(Exercise, payload.exercise_id)
    if not ex:
        raise HTTPException(404, "Exercise not found")

    entry = SetEntry(
        session_id=session_id,
        exercise_id=payload.exercise_id,
        weight_kg=float(payload.weight_kg),
        reps=int(payload.reps),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@app.get("/sessions/{session_id}/entries", response_model=List[EntryOut])
def list_entries(session_id: int, db: Session = Depends(get_session)):
    s = db.get(WorkoutSession, session_id)
    if not s:
        raise HTTPException(404, "Session not found")

    entries = db.exec(
        select(SetEntry)
        .where(SetEntry.session_id == session_id)
        .order_by(SetEntry.created_at.desc())
    ).all()

    exercises = {e.id: e for e in db.exec(select(Exercise)).all()}
    out: List[EntryOut] = []
    for entry in entries:
        ex = exercises.get(entry.exercise_id)
        out.append(
            EntryOut(
                id=entry.id,
                session_id=entry.session_id,
                exercise_id=entry.exercise_id,
                exercise_name=ex.name if ex else "Unknown",
                weight_kg=entry.weight_kg,
                reps=entry.reps,
                created_at=entry.created_at,
                total_kg=total_load(entry, ex, s),
            )
        )
    return out

@app.delete("/entries/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_session)):
    entry = db.get(SetEntry, entry_id)
    if not entry:
        raise HTTPException(404, "Entry not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}

class ProgressPoint(BaseModel):
    date: datetime
    weight_kg: float
    total_kg: float
    reps: int
    e1rm: float

def epley_1rm(weight_kg: float, reps: int) -> float:
    # Simple, stable heuristic
    return float(weight_kg) * (1.0 + (float(reps) / 30.0))

@app.get("/progress/exercise/{exercise_id}", response_model=List[ProgressPoint])
def exercise_progress(exercise_id: int, db: Session = Depends(get_session)):
    ex = db.get(Exercise, exercise_id)
    if not ex:
        raise HTTPException(404, "Exercise not found")

    rows = db.exec(
        select(SetEntry)
        .where(SetEntry.exercise_id == exercise_id)
        .order_by(SetEntry.created_at.asc())
    ).all()

    out: List[ProgressPoint] = []
    for r in rows:
        total = r.weight_kg
        if ex.uses_bodyweight:
            s = db.get(WorkoutSession, r.session_id)
            if s and s.bodyweight_kg is not None:
                total = float(r.weight_kg) + float(s.bodyweight_kg)
        out.append(
            ProgressPoint(
                date=r.created_at,
                weight_kg=r.weight_kg,
                total_kg=total,
                reps=r.reps,
                e1rm=epley_1rm(total, r.reps),
            )
        )
    return out

class BodyweightPoint(BaseModel):
    date: datetime
    weight_kg: float

@app.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_session)):
    s = db.get(WorkoutSession, session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    db.exec(delete(SetEntry).where(SetEntry.session_id == session_id))
    db.delete(s)
    db.commit()
    return {"ok": True}

class GoalIn(BaseModel):
    type: str
    exercise_id: Optional[int] = None
    target_weight_kg: Optional[float] = None
    target_reps: Optional[int] = None
    target_sessions_per_week: Optional[int] = None

class GoalOut(BaseModel):
    id: int
    type: str
    exercise_id: Optional[int]
    target_weight_kg: Optional[float]
    target_reps: Optional[int]
    target_sessions_per_week: Optional[int]
    created_at: datetime

class GoalsSummary(BaseModel):
    chinup_reps: int
    chinup_sets: int
    avg_load_kg: float
    total_sets: int

@app.get("/goals", response_model=List[GoalOut])
def list_goals(db: Session = Depends(get_session)):
    goals = db.exec(select(FitnessGoal).order_by(FitnessGoal.created_at.desc())).all()
    return [
        GoalOut(
            id=g.id,
            type=g.type,
            exercise_id=g.exercise_id,
            target_weight_kg=g.target_weight_kg,
            target_reps=g.target_reps,
            target_sessions_per_week=g.target_sessions_per_week,
            created_at=g.created_at,
        )
        for g in goals
    ]

@app.post("/goals", response_model=GoalOut)
def create_goal(payload: GoalIn, db: Session = Depends(get_session)):
    goal_type = (payload.type or "").strip().lower()
    if goal_type not in {"pr", "frequency"}:
        raise HTTPException(400, "Invalid goal type")

    if goal_type == "pr":
        if not payload.exercise_id or not payload.target_weight_kg or not payload.target_reps:
            raise HTTPException(400, "PR goals require exercise_id, target_weight_kg, target_reps")
        if payload.target_weight_kg <= 0 or payload.target_reps <= 0:
            raise HTTPException(400, "PR goals must be positive")
    if goal_type == "frequency":
        if not payload.target_sessions_per_week:
            raise HTTPException(400, "Frequency goals require target_sessions_per_week")
        if payload.target_sessions_per_week <= 0:
            raise HTTPException(400, "Frequency goals must be positive")

    goal = FitnessGoal(
        type=goal_type,
        exercise_id=payload.exercise_id,
        target_weight_kg=payload.target_weight_kg,
        target_reps=payload.target_reps,
        target_sessions_per_week=payload.target_sessions_per_week,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return GoalOut(
        id=goal.id,
        type=goal.type,
        exercise_id=goal.exercise_id,
        target_weight_kg=goal.target_weight_kg,
        target_reps=goal.target_reps,
        target_sessions_per_week=goal.target_sessions_per_week,
        created_at=goal.created_at,
    )

@app.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_session)):
    goal = db.get(FitnessGoal, goal_id)
    if not goal:
        raise HTTPException(404, "Goal not found")
    db.delete(goal)
    db.commit()
    return {"ok": True}

@app.get("/goals/summary", response_model=GoalsSummary)
def goals_summary(db: Session = Depends(get_session)):
    exercises = db.exec(select(Exercise)).all()
    ex_map = {e.id: e for e in exercises}
    chinup_ids = {e.id for e in exercises if "chin" in e.name.lower()}

    sessions = {s.id: s for s in db.exec(select(WorkoutSession)).all()}
    entries = db.exec(select(SetEntry)).all()

    total_sets = len(entries)
    total_load_sum = 0.0
    chinup_reps = 0
    chinup_sets = 0

    for entry in entries:
        ex = ex_map.get(entry.exercise_id)
        session = sessions.get(entry.session_id)
        total = total_load(entry, ex, session)
        total_load_sum += total
        if entry.exercise_id in chinup_ids:
            chinup_reps += int(entry.reps)
            chinup_sets += 1

    avg_load = total_load_sum / total_sets if total_sets else 0.0
    return GoalsSummary(
        chinup_reps=chinup_reps,
        chinup_sets=chinup_sets,
        avg_load_kg=avg_load,
        total_sets=total_sets,
    )

@app.post("/admin/reset")
def admin_reset(db: Session = Depends(get_session)):
    db.exec(delete(SetEntry))
    db.exec(delete(WorkoutSession))
    db.exec(delete(FitnessGoal))
    db.commit()
    seed_exercises(db)
    return {"ok": True}

@app.get("/bodyweight", response_model=List[BodyweightPoint])
def bodyweight_history(db: Session = Depends(get_session)):
    rows = db.exec(
        select(WorkoutSession)
        .where(WorkoutSession.bodyweight_kg.is_not(None))
        .order_by(WorkoutSession.started_at.asc())
    ).all()
    out: List[BodyweightPoint] = []
    for s in rows:
        out.append(
            BodyweightPoint(
                date=s.started_at,
                weight_kg=float(s.bodyweight_kg),
            )
        )
    return out
