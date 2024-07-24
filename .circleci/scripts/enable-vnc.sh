#!/usr/bin/env bash

# This script is based on the documentation from CircleCI, which does not work as written
# https://circleci.com/docs/browser-testing/#interacting-with-the-browser-over-vnc

set -e
set -u
set -o pipefail

cd ~/project

if [ ! -f installed.lock ]; then
  touch installed.lock

  sudo apt update
  sudo apt install -y fluxbox tigervnc-standalone-server

  export DISPLAY=:1
  tigervncserver -SecurityTypes none -desktop fluxbox
  fbsetbg -c app/images/icon-512.png
fi
