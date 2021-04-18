#!/usr/bin/env bash

set -e
set -u
set -o pipefail

yarn allow-scripts auto

if git diff --exit-code --quiet
then
  echo "allow-scripts configuration is up-to-date"
else
  echo "allow-scripts configuration requires updates"
  exit 1
fi
