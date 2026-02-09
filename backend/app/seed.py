from sqlmodel import Session, select
from .models import Exercise

PRESET_EXERCISES = [
    "Back Squat",
    "Bulgarian Split Squat",
    "Calf Raise",
    "Leg Extension",
    "Hamstring Curl",
    "Lunge",
    "Glute Bridge",
    "Deadlift",
    "Romanian Deadlift",
    "Seated Row",
    "Chin-Up",
    "Weighted Chin-Up",
    "Back Hyperextensions",
    "Cable Face Pull",
    "Barbell Row",
    "Incline Dumbbell Press",
    "Weighted Dip",
    "Machine Pec Fly",
    "Single-Arm Cable Chest Fly",
    "Barbell Shoulder Press",
    "Dumbbell Shoulder Press",
    "Dumbbell Lateral Raise",
    "Cable Lateral Raise",
    "Machine Reverse Fly",
    "Shrugs",
    "Dumbbell Curls",
    "Preacher Curls",
    "Cable Tricep Extensions",
    "Cable Tricep Overhead Extensions",
    "Hip Abduction",
    "Hanging Leg Raise",
    "Ab Curl",
    "Cable Crunch",
    "Plank",
]

def seed_exercises(db: Session) -> None:
    existing_names = set(db.exec(select(Exercise.name)).all())
    bodyweight_exercises = {"Chin-Up", "Weighted Chin-Up", "Weighted Dip"}

    for name in PRESET_EXERCISES:
        if name in existing_names:
            continue
        db.add(Exercise(name=name, uses_bodyweight=name in bodyweight_exercises))

    # Ensure bodyweight flag is set for known exercises
    for ex in db.exec(select(Exercise)).all():
        if ex.name in bodyweight_exercises and not ex.uses_bodyweight:
            ex.uses_bodyweight = True
            db.add(ex)
    db.commit()
