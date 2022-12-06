#!/usr/bin/env bash

# Print commands and their arguments as they are executed.
set -x
# Exit immediately if a command exits with a non-zero status.
set -e

yarn install --frozen-lockfile

