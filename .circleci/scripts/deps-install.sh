#!/usr/bin/env bash

# Print commands and their arguments as they are executed.
set -x
# Exit immediately if a command exits with a non-zero status.
set -e

yarn --frozen-lockfile --ignore-scripts --har

# use allow-scripts instead of manually running install scripts so directory change does not persist

yarn allow-scripts
