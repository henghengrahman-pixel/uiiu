FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg python3 python3-venv ca-certificates fonts-dejavu-core && rm -rf /var/lib/apt/lists/* \
 && python3 -m venv /opt/ytdlp && /opt/ytdlp/bin/pip install --no-cache-dir 'yt-dlp>=2025.1.0'
ENV PATH="/opt/ytdlp/bin:$PATH" NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["npm","start"]
