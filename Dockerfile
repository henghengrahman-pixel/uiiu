# Deno supplies the JavaScript runtime required by recent yt-dlp YouTube extraction.
FROM denoland/deno:bin-2.5.6 AS deno-runtime
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg python3 python3-venv ca-certificates fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/* \
 && python3 -m venv /opt/ytdlp \
 && /opt/ytdlp/bin/pip install --no-cache-dir --upgrade 'yt-dlp[default]'
COPY --from=deno-runtime /deno /usr/local/bin/deno
ENV PATH="/opt/ytdlp/bin:$PATH" NODE_ENV=production DENO_NO_UPDATE_CHECK=1
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["npm","start"]
