# Multi-stage Docker build for Unified SIGNBRIDGE AI Deployment on Render
# Stage 1: Build React Frontend with Vite
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY signbridge-ai/frontend/package*.json ./
RUN npm install

COPY signbridge-ai/frontend/ ./
RUN npm run build

# Stage 2: Python FastAPI Backend serving built Frontend
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

COPY signbridge-ai/backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY signbridge-ai/ ./signbridge-ai/
COPY --from=frontend-builder /app/frontend/dist /app/signbridge-ai/frontend/dist

WORKDIR /app/signbridge-ai

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
