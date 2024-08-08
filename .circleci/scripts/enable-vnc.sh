#!/usr/bin/env bash

# This script is based on the documentation from CircleCI, which does not work as written
# https://circleci.com/docs/browser-testing/#interacting-with-the-browser-over-vnc

set -e
set -u
set -o pipefail
set -x

cd "${HOME}/project"

# Required to target the main X display
export DISPLAY=:1.0

readonly LOCK_FILE="installed.lock"
if [ ! -f "${LOCK_FILE}" ]; then
  sudo apt update
  # Install a WM + VNC server
  # NOTE: `gxmessage` is required for `fbsetbg`
  sudo apt install -y gxmessage fluxbox tigervnc-standalone-server

  touch "${LOCK_FILE}"
fi

# Start VNC server
if ! pgrep tigervncserver > /dev/null; then
  tigervncserver -SecurityTypes none -desktop fluxbox
fi

# Background
fbsetbg -c "${HOME}/project/app/images/icon-512.png"
