#!/bin/bash
yarn generate:attributions

ATTRIBUTIONS_FILE="./attribution.txt"

# check to see if there's changes on the attributions file
if ! git diff --exit-code "$ATTRIBUTIONS_FILE"; then
  echo "attribution.txt has changed!"
  echo "run \`yarn generate:attributions\` and commit changes."
  exit 1
fi
