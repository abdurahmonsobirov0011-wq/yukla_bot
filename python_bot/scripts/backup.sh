#!/usr/bin/env sh
set -eu
mkdir -p backups
stamp="$(date +%Y%m%d_%H%M%S)"
docker compose exec -T postgres pg_dump -U bot tezyukla > "backups/tezyukla_${stamp}.sql"
find backups -type f -name '*.sql' -mtime +14 -delete

