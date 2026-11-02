#!/usr/bin/env bash
set -euo pipefail
DIR="$(mktemp -d)"; trap 'rm -rf "$DIR"' EXIT
ffmpeg -hide_banner -loglevel error -y -f lavfi -i testsrc2=size=640x360:rate=30 -f lavfi -i sine=frequency=440:sample_rate=48000 -t 2 -c:v mpeg4 -c:a aac "$DIR/in.mp4"
node scripts/render-smoke.mjs "$DIR/in.mp4" "$DIR/out.mp4"
ffprobe -v error -show_entries stream=width,height,codec_name -of json "$DIR/out.mp4"
