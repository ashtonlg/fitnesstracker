from sqlmodel import Session, select
from .models import Exercise

PRESET_EXERCISES = [
    # LEGS
    {"name": "Back Squat", "body_part": "legs", "sub_part": "compound", "uses_bodyweight": False},
    {
        "name": "Bulgarian Split Squat",
        "body_part": "legs",
        "sub_part": "compound",
        "uses_bodyweight": False,
    },
    {"name": "Lunge", "body_part": "legs", "sub_part": "compound", "uses_bodyweight": False},
    {"name": "Leg Extension", "body_part": "legs", "sub_part": "quads", "uses_bodyweight": False},
    {
        "name": "Hamstring Curl",
        "body_part": "legs",
        "sub_part": "hamstrings",
        "uses_bodyweight": False,
    },
    {
        "name": "Romanian Deadlift",
        "body_part": "legs",
        "sub_part": "hamstrings",
        "uses_bodyweight": False,
    },
    {"name": "Glute Bridge", "body_part": "legs", "sub_part": "glutes", "uses_bodyweight": False},
    {
        "name": "Hip Abduction",
        "body_part": "legs",
        "sub_part": "abductors",
        "uses_bodyweight": False,
    },
    {
        "name": "Hip Adduction",
        "body_part": "legs",
        "sub_part": "adductors",
        "uses_bodyweight": False,
    },
    {"name": "Calf Raise", "body_part": "legs", "sub_part": "calves", "uses_bodyweight": False},
    {
        "name": "Dumbbell Tibialis Raise",
        "body_part": "legs",
        "sub_part": "tibialis anterior",
        "uses_bodyweight": False,
    },
    # BACK
    {"name": "Deadlift", "body_part": "back", "sub_part": "compound", "uses_bodyweight": False},
    {"name": "Seated Row", "body_part": "back", "sub_part": "compound", "uses_bodyweight": False},
    {"name": "Barbell Row", "body_part": "back", "sub_part": "compound", "uses_bodyweight": False},
    {"name": "Chin-Up", "body_part": "back", "sub_part": "compound", "uses_bodyweight": True},
    {
        "name": "Weighted Chin-Up",
        "body_part": "back",
        "sub_part": "compound",
        "uses_bodyweight": True,
    },
    {
        "name": "Back Hyperextensions",
        "body_part": "back",
        "sub_part": "lower back",
        "uses_bodyweight": False,
    },
    # CHEST
    {
        "name": "Incline Dumbbell Press",
        "body_part": "chest",
        "sub_part": "compound",
        "uses_bodyweight": False,
    },
    {"name": "Weighted Dip", "body_part": "chest", "sub_part": "compound", "uses_bodyweight": True},
    {"name": "Machine Pec Fly", "body_part": "chest", "sub_part": "pecs", "uses_bodyweight": False},
    {
        "name": "Single-Arm Cable Chest Fly",
        "body_part": "chest",
        "sub_part": "pecs",
        "uses_bodyweight": False,
    },
    # SHOULDERS
    {
        "name": "Barbell Shoulder Press",
        "body_part": "shoulders",
        "sub_part": "compound",
        "uses_bodyweight": False,
    },
    {
        "name": "Dumbbell Shoulder Press",
        "body_part": "shoulders",
        "sub_part": "compound",
        "uses_bodyweight": False,
    },
    {
        "name": "Dumbbell Lateral Raise",
        "body_part": "shoulders",
        "sub_part": "lateral delts",
        "uses_bodyweight": False,
    },
    {
        "name": "Cable Lateral Raise",
        "body_part": "shoulders",
        "sub_part": "lateral delts",
        "uses_bodyweight": False,
    },
    {
        "name": "Machine Reverse Fly",
        "body_part": "shoulders",
        "sub_part": "rear delts",
        "uses_bodyweight": False,
    },
    {
        "name": "Cable Face Pull",
        "body_part": "shoulders",
        "sub_part": "rear delts",
        "uses_bodyweight": False,
    },
    {"name": "Shrugs", "body_part": "shoulders", "sub_part": "traps", "uses_bodyweight": False},
    # ARMS
    {"name": "Dumbbell Curls", "body_part": "arms", "sub_part": "biceps", "uses_bodyweight": False},
    {"name": "Preacher Curls", "body_part": "arms", "sub_part": "biceps", "uses_bodyweight": False},
    {
        "name": "Cable Tricep Extensions",
        "body_part": "arms",
        "sub_part": "triceps",
        "uses_bodyweight": False,
    },
    {
        "name": "Cable Tricep Overhead Extensions",
        "body_part": "arms",
        "sub_part": "triceps",
        "uses_bodyweight": False,
    },
    {"name": "Wrist Curl", "body_part": "arms", "sub_part": "forearms", "uses_bodyweight": False},
    {
        "name": "Reverse Wrist Curl",
        "body_part": "arms",
        "sub_part": "forearms",
        "uses_bodyweight": False,
    },
    # CORE
    {"name": "Hanging Leg Raise", "body_part": "core", "sub_part": "abs", "uses_bodyweight": True},
    {"name": "Ab Curl", "body_part": "core", "sub_part": "abs", "uses_bodyweight": False},
    {"name": "Cable Crunch", "body_part": "core", "sub_part": "abs", "uses_bodyweight": False},
    {"name": "Plank", "body_part": "core", "sub_part": "abs", "uses_bodyweight": True},
    {
        "name": "Cable Woodchop",
        "body_part": "core",
        "sub_part": "obliques",
        "uses_bodyweight": False,
    },
    {"name": "Side Bend", "body_part": "core", "sub_part": "obliques", "uses_bodyweight": False},
]


def seed_exercises(db: Session) -> None:
    existing = {e.name: e for e in db.exec(select(Exercise)).all()}

    for ex in PRESET_EXERCISES:
        name = ex["name"]
        row = existing.get(name)
        if row:
            updated = False
            if row.uses_bodyweight != ex["uses_bodyweight"]:
                row.uses_bodyweight = ex["uses_bodyweight"]
                updated = True
            if (row.body_part or "") != ex["body_part"]:
                row.body_part = ex["body_part"]
                updated = True
            if (row.sub_part or "") != ex["sub_part"]:
                row.sub_part = ex["sub_part"]
                updated = True
            if updated:
                db.add(row)
        else:
            db.add(
                Exercise(
                    name=name,
                    uses_bodyweight=ex["uses_bodyweight"],
                    body_part=ex["body_part"],
                    sub_part=ex["sub_part"],
                )
            )
    db.commit()
