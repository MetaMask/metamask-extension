#!/bin/bash

# Stop the script if any command fails
set -e

# Define variables for better readability
IMAGE_NAME=e2e/chrome:latest
# CONTAINER_VOLUME_1=$(pwd)/test-artifacts/chrome/:/usr/src/app/test-artifacts/chrome
CONTAINER_VOLUME_1=$(pwd)/:/usr/src/app/

# copy build to the docker context
# mkdir -p test/src
#cp -r ./dist-test ./dist
#cp -r ./builds-test ./builds
# cp -r ./dist-test ./dist
# cp -r ./builds-test ./builds
# cp -r ./dist-test ../dist-test
# cp -r ./builds-test ../builds-test
# cp -r . .



# Build the Docker image
echo "Building the Docker image..."
docker build -t $IMAGE_NAME test/e2e/

# Check the script parameter
UPDATE_SNAPSHOTS=""
if [ "$1" == "update" ]; then
    UPDATE_SNAPSHOTS="--update-snapshots"
    echo " >> Updating snapshots!! Check screenshots change before you push them"
fi

# Run the Docker container
echo "Running the Docker container..."
result=$(docker run --init --platform linux/amd64 --rm -it --privileged -v "$CONTAINER_VOLUME_1" --network host $IMAGE_NAME $UPDATE_SNAPSHOTS | tee /dev/fd/2)
if [ "$result" != "ok" ]; then
    echo "Visual tests failed"
fi

# Remove the Docker image
# echo "Removing the Docker image..."
# docker image rm $IMAGE_NAME

# # Remove files copied the building the image
# echo "Removing dist/chrome from test dir..."
# rm -rf /dist-test

# echo "Script completed successfully."