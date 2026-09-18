#!/bin/bash

# Script to clean up all generated files and directories
# Usage: ./cleanup.sh

set -e  # Exit on error
set -u  # Exit on undefined variable

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Source common functions
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/common.sh"

# Change to repository root
cd "${SCRIPT_DIR}"

echo ""
echo "=========================================="
echo "  Firefox Bundle Script Cleanup"
echo "=========================================="
echo ""

# Clean output directory
if [ -d "output" ]; then
    log_info "Removing output/ directory..."
    rm -rf output
    log_success "Removed output/ directory"
else
    log_info "No output/ directory found"
fi

echo ""
echo "=========================================="
log_success "Cleanup complete!"
echo "=========================================="
echo ""

