#!/bin/bash

# Stop the script if any command fails
set -e

# Define variables for better readability
IMAGE_NAME=e2e/mmi-dashboard:latest
CONTAINER_VOLUME_1=$(pwd)/public/playwright/playwright-reports:/usr/src/app/public/playwright/playwright-reports
CONTAINER_VOLUME_2=$(pwd)/test/e2e/mmi/specs:/usr/src/app/test/e2e/mmi/specs

# copy mmi build to the docker context
mkdir -p test/e2e/mmi/dist
cp -r dist/chrome test/e2e/mmi/dist/chrome

# copy playwright config to the docker context
cp playwright.config.ts test/e2e/mmi/

# Build the Docker image
echo "Building the Docker image..."
docker build -t $IMAGE_NAME test/e2e/mmi/

# Check the script parameter
UPDATE_SNAPSHOTS=""
if [ "$1" == "update" ]; then
    UPDATE_SNAPSHOTS="--update-snapshots"
    echo " >> Updating snapshots!! Check screenshots change before you push them"
fi

# Run the Docker container
echo "Running the Docker container..."
result=$(docker run --rm -it --privileged -v "$CONTAINER_VOLUME_1" -v "$CONTAINER_VOLUME_2" --network host $IMAGE_NAME $UPDATE_SNAPSHOTS | tee /dev/fd/2)
if [ "$result" != "ok" ]; then
    echo "Visual tests failed"
fi

# Remove the Docker image
echo "Removing the Docker image..."
docker image rm $IMAGE_NAME

# Remove files copied the building the image
echo "Removing playwright.config.ts..."
rm test/e2e/mmi/playwright.config.ts
echo "Removing mmi dist/chrome from test dir..."
rm -rf test/e2e/mmi/dist

echo "Script completed successfully."