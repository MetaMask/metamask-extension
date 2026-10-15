#!/bin/bash
/**
 * @fileoverview Script to verify that the committed 'attribution.txt' file is up-to-date.
 * This is achieved by regenerating the attributions and checking for uncommitted changes.
 * The script will fail if the committed file is stale.
 */

# Enable strict mode: 
# -e: Exit immediately if a command exits with a non-zero status.
# -u: Treat unset variables as an error.
# -o pipefail: The whole pipeline fails if any command in the pipeline fails.
set -euo pipefail

ATTRIBUTIONS_FILE="./attribution.txt"

echo "1. Regenerating attribution file..."
# Run the tool that generates the attribution file based on current dependencies.
# If this command fails, the script will exit immediately due to 'set -e'.
yarn attributions:generate

echo "2. Checking for uncommitted changes in ${ATTRIBUTIONS_FILE}..."

# git diff --exit-code returns:
# 0: No differences found (file is up-to-date).
# 1: Differences found (file is stale).
# >1: Error occurred (caught by set -e, but added for clarity).
if ! git diff --exit-code "$ATTRIBUTIONS_FILE"; then
  # If git diff returns 1 (differences found), the 'if !' block executes.
  
  echo "--- ERROR: ATTRIBUTIONS FILE IS STALE ---" >&2
  echo "The set of attributions kept in \`${ATTRIBUTIONS_FILE}\` are out of date." >&2
  echo "Action Required:" >&2
  echo "1. Run \`yarn attributions:generate\` locally." >&2
  echo "2. Commit and push the updated file." >&2
  echo "If running in a Pull Request, you can also post the comment \`@metamaskbot update-attributions\`." >&2
  
  # Exit with status 1 to fail the check.
  exit 1
fi

echo "Success: The attribution file is up to date."
