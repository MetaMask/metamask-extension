#!/bin/bash

# Stop the script if any command fails
set -e

# Define variables for better readability
IMAGE_NAME=e2e/mmi-dashboard:latest
CONTAINER_VOLUME_1=$(pwd)/public/playwright/playwright-reports:/usr/src/app/public/playwright/playwright-reports
CONTAINER_VOLUME_2=$(pwd)/test/e2e/mmi/specs:/usr/src/app/test/e2e/mmi/specs

# Build the Docker image
echo "Building the Docker image..."
docker build -t $IMAGE_NAME .

# Check the script parameter
UPDATE_SNAPSHOTS=""
if [ "$1" == "update" ]; then
    UPDATE_SNAPSHOTS="--update-snapshots"
fi

# Run the Docker container
echo "Running the Docker container..."
docker run --rm -it --privileged -v "$CONTAINER_VOLUME_1" -v "$CONTAINER_VOLUME_2" --network host $IMAGE_NAME $UPDATE_SNAPSHOTS

# Remove the Docker image
echo "Removing the Docker image..."
docker image rm $IMAGE_NAME

echo "Script completed successfully."