#!/bin/bash

# Script to download MetaMask extension builds and compare them
#
# Dependencies:
#   - Fetches bundle.sh at FIREFOX_BUNDLE_SH_GIT_REF (default v${VERSION} tag) each run
#   - Downloads files from GitHub
#
# Outputs:
#   - source.zip (source code archive)
#   - metamask-firefox-${VERSION}.zip (production build)
#   - comparison_report_v${VERSION}.txt (comparison results)
#   - .comparison_result (IDENTICAL or DIFFERENT)
#
# Usage: ./compare_builds.sh <version> <work_dir>

set -e  # Exit on error
set -u  # Exit on undefined variable

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Source common functions
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/common.sh"

# Check arguments
if [ $# -lt 2 ]; then
    log_error "Usage: $0 <version> <work_dir>"
    exit 1
fi

VERSION=$1
WORK_DIR=$2
PRODUCTION_BUILD_FILE="${PRODUCTION_BUILD_FILE:-metamask-firefox-${VERSION}.zip}"
FIREFOX_BUNDLE_SCRIPT_ARGS="${FIREFOX_BUNDLE_SCRIPT_ARGS:-}"

log_info "Comparing builds for MetaMask Extension version ${VERSION}"

# Change to repository root
cd "${SCRIPT_DIR}"

# Determine bundle.sh path (should be in output/ directory)
# WORK_DIR is already an absolute path from prepare_release.sh
OUTPUT_DIR=$(dirname "${WORK_DIR}")
BUNDLE_SH_PATH="${OUTPUT_DIR}/bundle.sh"

# Navigate to work directory
cd "${WORK_DIR}"

# Define URLs
FIREFOX_BUILD_URL="https://github.com/MetaMask/metamask-extension/releases/download/v${VERSION}/${PRODUCTION_BUILD_FILE}"
SOURCE_CODE_URL="https://github.com/MetaMask/metamask-extension/archive/refs/tags/v${VERSION}.zip"

# Step 1: Download Firefox production build
log_info "Downloading Firefox production build..."
if curl -L -f -o "${PRODUCTION_BUILD_FILE}" "${FIREFOX_BUILD_URL}"; then
    log_success "Downloaded ${PRODUCTION_BUILD_FILE}"
else
    log_error "Failed to download Firefox build. Please check if version ${VERSION} exists."
    exit 1
fi


SOURCE_DIR="${SCRIPT_DIR}/../../../"

# Step 4: Copy bundle script to source directory
log_info "Copying bundle script to source directory..."
cp "${BUNDLE_SH_PATH}" "${SOURCE_DIR}/bundle.sh"
log_success "Bundle script copied to ${SOURCE_DIR}"

# Step 5: Make bundle script executable
log_info "Making bundle script executable..."
chmod +x "${SOURCE_DIR}/bundle.sh"
log_success "Bundle script is now executable"

# Step 6: Run bundle script
log_info "Running bundle script..."
log_info "This will take approximately 5 minutes. Please be patient..."
cd "${SOURCE_DIR}"
if ./bundle.sh ${FIREFOX_BUNDLE_SCRIPT_ARGS}; then
    log_success "Bundle script completed successfully"
else
    log_error "Bundle script failed"
    exit 1
fi

runtime_hash="$(find ./dist/firefox/ -name "runtime.*" | cut -d . -f 3)"

cd "${WORK_DIR}"

# Check if build was created
if [ ! -d "${SOURCE_DIR}/builds" ]; then
    log_error "Build directory not found at ${SOURCE_DIR}/builds"
    exit 1
fi

if [ "${runtime_hash}" = "1623a92649bf9684cb25" ]; then
    exit 0
else
    exit 1
fi
