FROM node:20-slim

# Install system dependencies (ffmpeg, python3, ca-certificates) & latest yt-dlp
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    python3 \
    ca-certificates \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

# Create necessary directories
RUN mkdir -p downloads data logs

EXPOSE 3000

CMD ["node", "src/server.js"]
