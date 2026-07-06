.PHONY: dev dev-backend dev-frontend build migrate test lint

# ─── Docker ────────────────────────────────────────────
dev:
	docker compose up --build

dev-background:
	docker compose up --build -d

stop:
	docker compose down

logs:
	docker compose logs -f

# ─── Database ───────────────────────────────────────────
migrate:
	cd backend && alembic upgrade head

migrate-downgrade:
	cd backend && alembic downgrade -1

migrate-reset:
	cd backend && alembic downgrade base && alembic upgrade head

# ─── Frontend ──────────────────────────────────────────
dev-frontend:
	cd HubNear && npm run dev

build-frontend:
	cd HubNear && npm run build

preview:
	cd HubNear && npm run preview

# ─── Backend ────────────────────────────────────────────
dev-backend:
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# ─── Tests ──────────────────────────────────────────────
test:
	cd backend && uv run python -m pytest tests/ -v

test-coverage:
	cd backend && uv run python -m pytest tests/ -v --cov=app

# ─── Lint ────────────────────────────────────────────────
lint-frontend:
	cd HubNear && npx tsc --noEmit

lint-backend:
	cd backend && uv run ruff check .
