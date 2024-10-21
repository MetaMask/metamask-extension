#!/usr/bin/env bash

# This script is based on the documentation from CircleCI, which does not work as written
# https://circleci.com/docs/browser-testing/#interacting-with-the-browser-over-vnc

set -e
set -u
set -o pipefail
set -x

cd "${HOME}/project"

# Install a VNC server
readonly LOCK_FILE="installed.lock"
if [ ! -f "${LOCK_FILE}" ]; then
  sudo apt update
  sudo apt install -y x11vnc

  touch "${LOCK_FILE}"
fi

# Start VNC server
if ! pgrep x11vnc > /dev/null; then
  x11vnc -display "$DISPLAY" -bg -forever -nopw -quiet -listen localhost -xkb -rfbport 5901 -passwd password
fi
