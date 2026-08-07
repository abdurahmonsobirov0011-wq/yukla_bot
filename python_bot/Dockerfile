FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_ENV=production \
    PORT=8000 \
    DOWNLOAD_DIR=/tmp/tezyukla-downloads \
    CACHE_DIR=/tmp/tezyukla-cache \
    LOG_DIR=/app/logs

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential ffmpeg git libmagic1 curl ca-certificates \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod 0755 /usr/local/bin/yt-dlp \
  && apt-get purge -y --auto-remove curl \
  && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --no-cache-dir -U pip \
  && pip install --no-cache-dir .

COPY . .
RUN useradd --create-home --shell /usr/sbin/nologin appuser \
  && mkdir -p /app/logs /tmp/tezyukla-downloads /tmp/tezyukla-cache \
  && chown -R appuser:appuser /app /tmp/tezyukla-downloads /tmp/tezyukla-cache

USER appuser
EXPOSE 8000
CMD ["python", "-m", "app.main"]
