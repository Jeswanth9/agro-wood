.PHONY: back
back:
	@echo "Starting backend..."
	cd backend && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000

.PHONY: frontend
frontend:
	@echo "Starting frontend..."
	cd frontend && npm run dev
