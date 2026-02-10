# Fitness Tracker

A simple fitness tracker for my gym exercises. It is a lightweight web app hosted remotely on my Raspberry Pi.

## Development

### Local Development (without Docker)

Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Testing & Linting

Backend tests and linting:
```bash
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest
ruff check .
ruff format .
```

Frontend tests:
```bash
cd frontend
npm install
npm test
```

Run everything from the repo root:
```bash
make test
make lint
make format
```

Pre-commit:
```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

### Build/Update (Production)

From the fitnesstracker directory:
```bash
# Full update - stop, rebuild, start
make update

# Individual commands
make build    # Rebuild containers
make up       # Start containers
make down     # Stop containers
make logs     # View logs
make status   # Check status
```

Or from the app-controller directory:
```bash
cd ../app-controller
python3 build.py fitnesstracker update
```

## Architecture

- **Backend**: FastAPI + SQLModel + SQLite
- **Frontend**: React + Vite + nginx
- **Deployment**: Docker Compose via App Controller

## Database Migrations

The app uses SQLite with lightweight migrations in `backend/app/db.py`. When adding new columns:

1. Update the model in `backend/app/models.py`
2. Add migration code in `backend/app/db.py` `init_db()` function
3. Rebuild and restart: `make update`
