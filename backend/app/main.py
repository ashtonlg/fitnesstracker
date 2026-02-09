from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .db import init_db, get_session
from .models import Exercise, WorkoutSession, SetEntry
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

@app.post("/sessions/start", response_model=WorkoutSession)
def start_session(payload: SessionStartIn | None = None, db: Session = Depends(get_session)):
    bodyweight = payload.bodyweight_kg if payload else None
    s = WorkoutSession(bodyweight_kg=bodyweight)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

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
