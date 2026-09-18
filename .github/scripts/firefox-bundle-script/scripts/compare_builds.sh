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

# Always fetch at FIREFOX_BUNDLE_SH_GIT_REF (default v${VERSION}) so a prior run cannot
# reuse output/bundle.sh for a different version.
if ! fetch_bundle_sh "${BUNDLE_SH_PATH}"; then
    exit 1
fi

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

# Step 2: Download source code
log_info "Downloading source code..."
if curl -L -f -o "source.zip" "${SOURCE_CODE_URL}"; then
    log_success "Downloaded source code"
else
    log_error "Failed to download source code. Please check if version ${VERSION} exists."
    exit 1
fi

# Step 3: Extract source code
log_info "Extracting source code..."
unzip -q source.zip
SOURCE_DIR="metamask-extension-${VERSION}"
if [ ! -d "${SOURCE_DIR}" ]; then
    log_error "Source directory ${SOURCE_DIR} not found after extraction"
    exit 1
fi
log_success "Source code extracted to ${SOURCE_DIR}"

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
cd ..

# Check if build was created
if [ ! -d "${SOURCE_DIR}/builds" ]; then
    log_error "Build directory not found at ${SOURCE_DIR}/builds"
    exit 1
fi

# Step 7: Prepare for comparison
log_info "Preparing builds for comparison..."
COMPARISON_DIR="comparison"
mkdir -p "${COMPARISON_DIR}"
cd "${COMPARISON_DIR}"

# Step 8: Extract production build
log_info "Extracting production build..."
mkdir -p production_build
cd production_build
unzip -q "../../${PRODUCTION_BUILD_FILE}"
cd ..
log_success "Production build extracted"

# Step 9: Extract local build
log_info "Extracting local build..."
mkdir -p local_build
cd local_build
FIREFOX_BUILD_ZIP="../../${SOURCE_DIR}/builds/${PRODUCTION_BUILD_FILE}"
if [ ! -f "${FIREFOX_BUILD_ZIP}" ]; then
    log_error "Could not find Firefox build zip at ${FIREFOX_BUILD_ZIP}"
    exit 1
fi
unzip -q "${FIREFOX_BUILD_ZIP}"
cd ..
log_success "Local build extracted"

# Step 10: Compare builds using mtree
log_info "Creating checksum snapshot of production build..."
mtree -c -k sha256digest -p production_build > snapshot.mtree
log_success "Snapshot created"

log_info "Comparing local build with production build..."
echo ""
echo "=========================================="
echo "          COMPARISON RESULTS"
echo "=========================================="
echo ""

if mtree -p local_build < snapshot.mtree > comparison_output.txt 2>&1; then
    log_success "✓ BUILDS ARE IDENTICAL!"
    log_success "Both builds match perfectly. You can proceed with the Firefox submission."
    RESULT="IDENTICAL"
else
    log_error "✗ BUILDS DIFFER!"
    log_error "The following differences were found:"
    echo ""
    cat comparison_output.txt
    echo ""
    log_error "The builds are NOT identical. Please review the differences above."
    RESULT="DIFFERENT"
fi

echo ""
echo "=========================================="
echo ""

# Step 11: Save comparison report
cd ..
REPORT_FILE="comparison_report_v${VERSION}.txt"
{
    echo "MetaMask Extension Build Comparison Report"
    echo "=========================================="
    echo "Version: ${VERSION}"
    echo "Date: $(date)"
    echo "Result: ${RESULT}"
    echo ""
    echo "Files compared:"
    echo "  - Production build: ${PRODUCTION_BUILD_FILE}"
    echo "  - Local build: ${FIREFOX_BUILD_ZIP}"
    echo ""
    if [ "${RESULT}" = "DIFFERENT" ]; then
        echo "Differences found:"
        echo "----------------------------------------"
        cat "${COMPARISON_DIR}/comparison_output.txt"
    else
        echo "No differences found. Builds are identical."
    fi
} > "${REPORT_FILE}"

log_info "Comparison report saved to: ${PWD}/${REPORT_FILE}"

# Export result for parent script
echo "${RESULT}" > .comparison_result

if [ "${RESULT}" = "IDENTICAL" ]; then
    exit 0
else
    exit 1
fi
