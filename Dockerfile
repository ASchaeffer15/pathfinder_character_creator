# Stage 1: Build the React Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend with LangChain and Transformers
FROM python:3.11-slim
WORKDIR /app

# Install security audit tools and system libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies and run pip-audit check
COPY requirements.txt verify_packages.py ./
RUN python -m pip install --upgrade pip
RUN python -m pip install pip-audit
RUN python verify_packages.py requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and frontend build
COPY backend/ ./backend/
COPY data/ ./data/
COPY aon_scraper/ ./aon_scraper/
COPY scripts/ ./scripts/
COPY run_app.py train_lora.py ./
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

CMD ["python", "run_app.py"]
