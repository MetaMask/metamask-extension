#!/bin/bash

# Script to create Firefox submission package
#
# Dependencies:
#   - Must be run AFTER compare_builds.sh
#   - Requires files downloaded by compare_builds.sh:
#     * source.zip (source code archive)
#     * metamask-firefox-${VERSION}.zip (production build)
#
# Usage: ./create_submission_package.sh <version> <last_version> <work_dir>

set -e  # Exit on error
set -u  # Exit on undefined variable

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Source common functions
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/common.sh"

# Check arguments
if [ $# -lt 3 ]; then
    log_error "Usage: $0 <version> <last_version> <work_dir>"
    exit 1
fi

VERSION=$1
LAST_VERSION=$2
WORK_DIR=$3
PRODUCTION_BUILD_FILE="${PRODUCTION_BUILD_FILE:-metamask-firefox-${VERSION}.zip}"
SUBMISSION_DIR_PREFIX="${SUBMISSION_DIR_PREFIX:-submission}"
FIREFOX_BUNDLE_SCRIPT_ARGS="${FIREFOX_BUNDLE_SCRIPT_ARGS:-}"

log_info "Creating Firefox submission package..."

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

# Name of the source folder as it should appear inside the submission archive.
SOURCE_DIR_NAME="metamask-extension-${VERSION}"

# Validate required files exist
log_info "Validating required files..."
if ! validate_required_files \
    "${WORK_DIR}/source.zip" \
    "${WORK_DIR}/${PRODUCTION_BUILD_FILE}"; then
    log_error "This script expects compare_builds.sh to have run first."
    log_error "Please run compare_builds.sh before running this script."
    exit 1
fi
log_success "All required files present"

# Navigate to work directory
cd "${WORK_DIR}"

# Save absolute path to source.zip before changing directories
SOURCE_ZIP_PATH="$(pwd)/source.zip"

# Create submission directory in output (sibling to work directory)
# OUTPUT_DIR is already an absolute path from dirname
SUBMISSION_DIR_ABSOLUTE="${OUTPUT_DIR}/${SUBMISSION_DIR_PREFIX}_v${VERSION}"
mkdir -p "${SUBMISSION_DIR_ABSOLUTE}"

# Copy the Firefox production build
log_info "Adding Firefox production build to submission package..."
cp "${PRODUCTION_BUILD_FILE}" "${SUBMISSION_DIR_ABSOLUTE}/"
log_success "Added ${PRODUCTION_BUILD_FILE}"

# Generate Firefox submission notes directly in submission package
FIREFOX_NOTES_FILE="firefox_submission_notes_v${VERSION}.txt"
FIREFOX_NOTES_PATH="${SUBMISSION_DIR_ABSOLUTE}/${FIREFOX_NOTES_FILE}"
bash "${SCRIPT_DIR}/scripts/generate_submission_notes.sh" "${VERSION}" "${LAST_VERSION}" "${FIREFOX_NOTES_PATH}"

# Create source code with bundle script
log_info "Preparing source code with bundle script..."
# OUTPUT_DIR is already an absolute path
TEMP_SOURCE_DIR_ABSOLUTE="${OUTPUT_DIR}/temp_source_for_submission"
rm -rf "${TEMP_SOURCE_DIR_ABSOLUTE}"
mkdir -p "${TEMP_SOURCE_DIR_ABSOLUTE}"

# Extract source code to temp directory
log_info "Extracting source code..."
cd "${TEMP_SOURCE_DIR_ABSOLUTE}"
unzip -q "${SOURCE_ZIP_PATH}"

# Add bundle script to source code
log_info "Adding bundle script to source code..."
cp "${BUNDLE_SH_PATH}" "${SOURCE_DIR_NAME}/bundle.sh"
log_success "Bundle script added to source code"

# Re-zip the source code with bundle script
log_info "Creating source code archive..."
cd "${SOURCE_DIR_NAME}"
zip -qr "../${SOURCE_DIR_NAME}.zip" .
cd ..
mv "${SOURCE_DIR_NAME}.zip" "${SUBMISSION_DIR_ABSOLUTE}/"
log_success "Created ${SOURCE_DIR_NAME}.zip"

# Clean up temp directory
rm -rf "${TEMP_SOURCE_DIR_ABSOLUTE}"

# Set submission full path for display
SUBMISSION_FULL_PATH="${SUBMISSION_DIR_ABSOLUTE}"

# Create reviewer instructions
log_info "Creating reviewer instructions..."
REVIEWER_NOTES_FILE="reviewer_instructions_v${VERSION}.txt"

cat > "${SUBMISSION_DIR_ABSOLUTE}/${REVIEWER_NOTES_FILE}" << EOF
INSTRUCTIONS FOR FIREFOX REVIEWERS
===================================

Prerequisites:
* macOS or Linux operating system
* At least 4GB of available RAM

To reproduce the build that we submitted:

1. Extract the metamask-extension-${VERSION} source code file that we submitted
2. Change directories to the metamask-extension-${VERSION} directory
3. Make the bundle.sh script executable
4. Run ./bundle.sh ${FIREFOX_BUNDLE_SCRIPT_ARGS}
5. Get the build file out of the build directory

Here are the commands you can run to execute those steps:

unzip metamask-extension-${VERSION}.zip
cd metamask-extension-${VERSION}/
chmod +x ./bundle.sh
./bundle.sh ${FIREFOX_BUNDLE_SCRIPT_ARGS}
cd builds

RESULT:
-------
The ${PRODUCTION_BUILD_FILE} file in the build directory is the reproduced build.
This should match the ${PRODUCTION_BUILD_FILE} production build we submitted.

EOF

log_success "Reviewer instructions created: ${REVIEWER_NOTES_FILE}"

log_success "Firefox submission package created!"
echo ""
echo "=========================================="
echo "   SUBMISSION PACKAGE READY"
echo "=========================================="
echo ""
log_info "Location: ${SUBMISSION_FULL_PATH}"
log_info "Contents:"
echo "  - ${PRODUCTION_BUILD_FILE} (production build)"
echo "  - metamask-extension-${VERSION}.zip (source code with bundle script)"
if [ -f "${SUBMISSION_FULL_PATH}/${FIREFOX_NOTES_FILE}" ]; then
    echo "  - ${FIREFOX_NOTES_FILE} (release notes for Firefox submission)"
fi
echo "  - reviewer_instructions_v${VERSION}.txt (instructions for Firefox reviewers)"
echo ""
log_success "This package is ready to submit to Firefox Add-ons store!"
echo ""
echo "=========================================="
echo "   REVIEWER INSTRUCTIONS"
echo "=========================================="
echo ""
cat "${SUBMISSION_DIR_ABSOLUTE}/${REVIEWER_NOTES_FILE}"
echo "=========================================="
echo ""
