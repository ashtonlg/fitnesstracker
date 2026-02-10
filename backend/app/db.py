import os
from sqlalchemy import text
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////data/app.db")

# SQLite needs check_same_thread=False for FastAPI concurrency
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)


def _sqlite_column_exists(table: str, column: str) -> bool:
    with engine.connect() as conn:
        rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
        return any(r[1] == column for r in rows)


def _sqlite_table_exists(table: str) -> bool:
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name=:name"),
            {"name": table},
        ).fetchone()
        return row is not None


def init_db() -> None:
    SQLModel.metadata.create_all(engine)

    # Lightweight sqlite migration for older DBs missing columns.
    if DATABASE_URL.startswith("sqlite"):
        if _sqlite_table_exists("exercise") and not _sqlite_column_exists(
            "exercise", "uses_bodyweight"
        ):
            with engine.connect() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE exercise ADD COLUMN uses_bodyweight BOOLEAN NOT NULL DEFAULT 0"
                    )
                )
                conn.commit()
        if _sqlite_table_exists("exercise") and not _sqlite_column_exists("exercise", "body_part"):
            with engine.connect() as conn:
                conn.execute(
                    text("ALTER TABLE exercise ADD COLUMN body_part TEXT NOT NULL DEFAULT 'other'")
                )
                conn.commit()
        if _sqlite_table_exists("exercise") and not _sqlite_column_exists("exercise", "sub_part"):
            with engine.connect() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE exercise ADD COLUMN sub_part TEXT NOT NULL DEFAULT 'compound'"
                    )
                )
                conn.commit()
        # Migrate workoutsession.bodyweight_kg (added 2026-02)
        if _sqlite_table_exists("workoutsession") and not _sqlite_column_exists(
            "workoutsession", "bodyweight_kg"
        ):
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE workoutsession ADD COLUMN bodyweight_kg FLOAT"))
                conn.commit()


def get_session():
    with Session(engine) as session:
        yield session
