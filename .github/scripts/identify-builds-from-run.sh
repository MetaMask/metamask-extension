#!/bin/bash

# If the string `[builds-from-run: <run-id>]` is contained in the last commit message
if [[ "$(git log -1 --pretty=%B)" =~ \[builds-from-run:[[:space:]]*([0-9]+)\] ]]; then
  # Extract the <run-id> value from the commit message
  builds_from_run="${BASH_REMATCH[1]}"
  echo "Found builds-from-run directive in commit message: $builds_from_run"
  echo "builds-from-run=$builds_from_run" >> "$GITHUB_OUTPUT"
else
  echo "No builds-from-run directive found in commit message."
  # Default to the current run ID
  echo "builds-from-run=${RUN_ID}" >> "$GITHUB_OUTPUT"
fi
