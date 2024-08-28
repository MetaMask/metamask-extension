#!/usr/bin/env bash

set -e
set -u
set -o pipefail

if ! git diff --exit-code
then
  echo "Working tree dirty"
  exit 1
fi
