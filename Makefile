# Fitness Tracker Build System
# Usage:
#   make build    - Build/rebuild all containers
#   make up       - Start containers
#   make down     - Stop containers
#   make update   - Full update: stop, rebuild, start
#   make logs     - View logs
#   make status   - Check container status

.PHONY: build up down update logs status clean test test-backend test-frontend lint format

build:
	docker compose build --no-cache

up:
	docker compose up -d

down:
	docker compose down

update: down build up
	@echo "Fitness Tracker updated successfully!"
	@docker compose ps

logs:
	docker compose logs -f

status:
	docker compose ps

clean: down
	docker compose rm -f
	docker volume prune -f

test: test-backend test-frontend

test-backend:
	cd backend && python -m pytest

test-frontend:
	cd frontend && npm test

lint:
	ruff check backend

format:
	ruff format backend
