### Generate Development Visualization

This will generate a video of the repo commit history.

Install preqs:
```
brew install gource
brew install ffmpeg
```

From the repo dir, pipe `gource` into `ffmpeg`:
```
gource \
  --seconds-per-day .1 \
  --user-scale 1.5 \
  --default-user-image "./images/icon-512.png" \
  --viewport 1280x720 \
  --auto-skip-seconds .1 \
  --multi-sampling \
  --stop-at-end \
  --highlight-users \
  --hide mouse,progress \
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
  | ffmpeg -y -r 30 -f image2pipe -vcodec ppm -i - -b 65536K metamask-dev-history.mp4
```

