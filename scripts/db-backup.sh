#!/bin/bash
# MongoDB Backup Automation Script
BACKUP_DIR="./backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017/telegram_downloader_db"}

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting MongoDB backup..."
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$TIMESTAMP"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup completed successfully: $BACKUP_DIR/$TIMESTAMP"
    # Keep only backups from the last 14 days
    find "$BACKUP_DIR" -type d -mtime +14 -exec rm -rf {} +
else
    echo "[$(date)] Backup failed!"
    exit 1
fi
