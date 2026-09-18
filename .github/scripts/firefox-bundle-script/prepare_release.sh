#!/bin/bash

# MetaMask Firefox Release Preparation Script
# This master script orchestrates the entire Firefox submission workflow:
# 1. Compares production and local builds
# 2. Generates Firefox submission notes
# 3. Creates ready-to-submit package

set -e  # Exit on error
set -u  # Exit on undefined variable

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common functions
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/common.sh"

RELEASE_TYPE="main"
if [ "${1:-}" = "--flask" ]; then
    RELEASE_TYPE="flask"
    shift
fi

FIREFOX_ADDONS_VERSIONS_URL="https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/versions/"
if [ "${RELEASE_TYPE}" = "flask" ]; then
    FIREFOX_ADDONS_VERSIONS_URL="https://addons.mozilla.org/en-US/firefox/addon/metamask-flask/versions/"
fi

ensure_mtree() {
  if command -v mtree >/dev/null 2>&1; then
    return
  fi
  # /usr/bin/mtree on Debian/Ubuntu comes from mtree-netbsd; compare_builds.sh
  # needs the NetBSD flavour (`mtree -c -k sha256digest -p`). macOS ships it.
  echo "Installing mtree for build comparison..."
  sudo apt-get update -qq
  sudo apt-get install -y mtree-netbsd
  command -v mtree >/dev/null 2>&1 || {
    echo "::error::mtree still unavailable after installing mtree-netbsd"
    exit 1
  }
}

ensure_mtree

# Check if version argument is provided, if not prompt for it
if [ $# -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  MetaMask Firefox Release Preparation"
    echo "=========================================="
    echo ""
    read -r -p "Enter the MetaMask Extension version to submit (e.g., 13.8.0): " VERSION
    echo ""

    # Validate that something was entered
    if [ -z "$VERSION" ]; then
        log_error "No version specified"
        exit 1
    fi

    echo "To check the latest version on Firefox Add-ons store, visit:"
    echo "${FIREFOX_ADDONS_VERSIONS_URL}"
    echo ""
    read -r -p "Enter the last version you submitted to Firefox store (e.g., 13.7.0): " LAST_VERSION
    echo ""

    # Validate that something was entered
    if [ -z "$LAST_VERSION" ]; then
        log_error "No last version specified"
        exit 1
    fi
else
    VERSION=$1
    if [ $# -ge 2 ]; then
        LAST_VERSION=$2
    else
        echo "To check the latest version on Firefox Add-ons store, visit:"
        echo "${FIREFOX_ADDONS_VERSIONS_URL}"
        echo ""
        read -r -p "Enter the last version you submitted to Firefox store (e.g., 13.7.0): " LAST_VERSION
        echo ""

        if [ -z "$LAST_VERSION" ]; then
            log_error "No last version specified"
            exit 1
        fi
    fi
fi

WORK_DIR_PREFIX="main0_comparison"

# Main-release defaults. These are set unconditionally (not only in the Flask
# branch below) so that a value left over in the caller's shell environment
# cannot leak into a main release run.
PRODUCTION_BUILD_FILE="metamask-firefox-${VERSION}.zip"
FIREFOX_BUNDLE_SCRIPT_ARGS=""

if [ "${RELEASE_TYPE}" = "flask" ]; then
    if [[ "${VERSION}" == *-flask.* ]] || [[ "${LAST_VERSION}" == *-flask.* ]]; then
        log_error "Pass base versions for Flask releases, e.g. ./prepare_release.sh --flask 13.32.0 13.31.0"
        exit 1
    fi
    FLASK_VERSION="${VERSION}-flask.0"
    WORK_DIR_PREFIX="flask_comparison"
    PRODUCTION_BUILD_FILE="metamask-firefox-${FLASK_VERSION}.zip"
    # NOTE: This variable must NOT be named with a `BUNDLE_` prefix. The
    # metamask-extension webpack CLI reads env vars prefixed `BUNDLE_` as CLI
    # arguments (cli.ts: `.env('BUNDLE')`), so e.g. `BUNDLE_SCRIPT_ARGS` would
    # be injected as `--scriptArgs` and fail the build with a strict-mode
    # "Unknown argument: scriptArgs" error.
    FIREFOX_BUNDLE_SCRIPT_ARGS="--flask"
fi

export PRODUCTION_BUILD_FILE
export FIREFOX_BUNDLE_SCRIPT_ARGS

log_info "Starting Firefox release preparation for MetaMask Extension version ${VERSION}"
log_info "Last submitted version: ${LAST_VERSION}"

# Check for required tools
if ! check_required_tools; then
    exit 1
fi

# Create output directory structure
OUTPUT_DIR="output"
WORK_DIR="${OUTPUT_DIR}/${WORK_DIR_PREFIX}_v${VERSION}"

# Use absolute paths
ABS_OUTPUT_DIR="${SCRIPT_DIR}/${OUTPUT_DIR}"
ABS_WORK_DIR="${SCRIPT_DIR}/${WORK_DIR}"
BUNDLE_SH_PATH="${ABS_OUTPUT_DIR}/bundle.sh"

mkdir -p "${ABS_OUTPUT_DIR}"
# Fetch bundle.sh at FIREFOX_BUNDLE_SH_GIT_REF (default v${VERSION} tag on release branch).
if ! fetch_bundle_sh "${BUNDLE_SH_PATH}"; then
	exit 1
fi

if [ -d "${ABS_WORK_DIR}" ]; then
    log_warning "Working directory ${WORK_DIR} already exists. Removing it..."
    rm -rf "${ABS_WORK_DIR}"
fi

mkdir -p "${ABS_WORK_DIR}"
log_success "Created working directory: ${WORK_DIR}"

echo ""
echo "=========================================="
echo "  STEP 1: BUILD COMPARISON"
echo "=========================================="
echo ""

# Run build comparison script (pass absolute path)
if bash "${SCRIPT_DIR}/scripts/compare_builds.sh" "${VERSION}" "${ABS_WORK_DIR}"; then
    COMPARISON_RESULT="IDENTICAL"
else
    COMPARISON_RESULT="DIFFERENT"
fi

echo ""
echo "=========================================="
echo "  RELEASE PREPARATION COMPLETE"
echo "=========================================="
echo ""

log_info "Working directory: ${ABS_WORK_DIR}"

echo ""

if [ "${COMPARISON_RESULT}" = "IDENTICAL" ]; then
    log_success "✓ Builds are identical - Ready for Firefox submission!"
    exit 0
else
    log_warning "⚠ Builds differ - Review the comparison report before submitting"
    exit 1
fi
