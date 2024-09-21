#!/usr/bin/env bash
set -x

gource \
  --seconds-per-day .025 \
  --user-scale 1.5 \
  --default-user-image "./app/images/icon-512.png" \
  --viewport 1280x720 \
  --auto-skip-seconds .05 \
  --multi-sampling \
  --highlight-users \
  --hide mouse,progress,filenames \
  --dir-name-depth 2 \
  --file-idle-time 0 \
  --max-files 0  \
  --background-colour 000000 \
  --font-size 18 \
  --date-format "%b %d, %Y" \
  --highlight-dirs \
  --user-friction 0.1 \
  --title "MetaMask Development History" \
  --output-ppm-stream - \
  --output-framerate 30 \
  | \
ffmpeg \
  -y \
  -r 30 \
  -f image2pipe \
  -vcodec ppm \
  -i \
  - \
  -b:v 65536K \
  metamask-dev-history.mp4
