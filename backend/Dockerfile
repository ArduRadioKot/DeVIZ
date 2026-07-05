FROM python:3.14-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . .

ENV PATH="/app/.venv/bin:$PATH"

CMD ["fastapi", "run", "main.py", "--host", "0.0.0.0", "--port", "8000"]
