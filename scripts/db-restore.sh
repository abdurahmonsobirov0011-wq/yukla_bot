#!/bin/bash
# MongoDB Restore Automation Script
if [ -z "$1" ]; then
    echo "Usage: ./db-restore.sh <path_to_backup_directory>"
    exit 1
fi

BACKUP_PATH="$1"
MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017/telegram_downloader_db"}

echo "[$(date)] Restoring MongoDB from: $BACKUP_PATH"
mongorestore --uri="$MONGODB_URI" "$BACKUP_PATH"

if [ $? -eq 0 ]; then
    echo "[$(date)] Restore completed successfully!"
else
    echo "[$(date)] Restore failed!"
    exit 1
fi
