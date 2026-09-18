#!/bin/bash

# Script to generate Firefox submission notes with release versions
#
# Dependencies:
#   - Internet connection (fetches from GitHub API)
#   - No file dependencies (can run independently)
#
# Outputs:
#   - <output_file_path> (formatted release notes)
#
# Usage: ./generate_submission_notes.sh <version> <last_version> <output_file_path>

set -e  # Exit on error
set -u  # Exit on undefined variable

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Source common functions
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/common.sh"

# Check arguments
if [ $# -lt 3 ]; then
    log_error "Usage: $0 <version> <last_version> <output_file_path>"
    exit 1
fi

VERSION=$1
LAST_VERSION=$2
OUTPUT_FILE_PATH=$3

log_info "Generating Firefox submission notes..."

# Fetch releases from GitHub API
if ! RELEASES_JSON=$(curl -f -s "https://api.github.com/repos/MetaMask/metamask-extension/releases?per_page=100"); then
    log_error "Failed to fetch releases from GitHub API"
    log_error "Please check your internet connection and try again"
    exit 1
fi

{
    # Parse releases and include all versions between LAST_VERSION and VERSION
    echo "$RELEASES_JSON" | grep -o '"tag_name": "v[^"]*"' | sed 's/"tag_name": "v\(.*\)"/\1/' | while read -r release_version; do
        # Check if this version is between LAST_VERSION (exclusive) and VERSION (inclusive)
        if version_gt "$release_version" "$LAST_VERSION" && ( [ "$release_version" = "$VERSION" ] || version_gt "$VERSION" "$release_version" ); then
            echo "## Version-v${release_version}"
            echo ""
            echo "https://github.com/MetaMask/metamask-extension/releases/tag/v${release_version}"
            echo ""
        fi
    done
} > "${OUTPUT_FILE_PATH}"

if [ -s "${OUTPUT_FILE_PATH}" ]; then
    log_success "Firefox submission notes generated!"
    echo ""
    echo "=========================================="
    echo "   FIREFOX SUBMISSION NOTES"
    echo "=========================================="
    echo ""
    cat "${OUTPUT_FILE_PATH}"
    echo "=========================================="
    echo ""
    log_info "Notes saved to: ${OUTPUT_FILE_PATH}"
else
    log_warning "No releases found between version ${LAST_VERSION} and ${VERSION}"
fi

echo ""

