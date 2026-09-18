#!/bin/bash

# Common functions and variables used by all scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to compare versions (returns 0 if v1 > v2, 1 if v1 <= v2)
version_gt() {
    test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"
}

# Check for required tools
check_required_tools() {
    local missing_tools=()
    
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi

    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi

    if ! command -v unzip &> /dev/null; then
        missing_tools+=("unzip")
    fi
    
    if ! command -v zip &> /dev/null; then
        missing_tools+=("zip")
    fi
    
    if ! command -v mtree &> /dev/null; then
        missing_tools+=("mtree")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "The following required tools are not installed:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        log_info "Please install the missing tools and try again."
        if [[ " ${missing_tools[*]} " =~ " mtree " ]]; then
            log_info "On macOS, mtree should be available by default."
            log_info "On Linux, you may need to install it via your package manager."
        fi
        return 1
    fi
    
    return 0
}

# Function to validate required files exist
# Usage: validate_required_files "file1" "file2" "file3"
validate_required_files() {
    local missing_files=()
    
    for file in "$@"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        log_error "Required files are missing:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        return 1
    fi
    
    return 0
}

# Resolve git ref for bundle.sh (tag, commit, or branch like origin/release).
# FIREFOX_BUNDLE_SH_GIT_REF overrides; otherwise default v${VERSION} when VERSION is set.
# Must use FIREFOX_ prefix — metamask-extension webpack CLI treats BUNDLE_* env vars as CLI flags.
resolve_bundle_sh_git_ref() {
    if [ -n "${FIREFOX_BUNDLE_SH_GIT_REF:-}" ]; then
        printf '%s\n' "${FIREFOX_BUNDLE_SH_GIT_REF}"
        return 0
    fi

    if [ -n "${VERSION:-}" ]; then
        # Normalize so a VERSION that already carries a leading 'v' does not
        # resolve to a double-prefixed 'vv...' ref.
        printf '%s\n' "v${VERSION#v}"
        return 0
    fi

    printf '%s\n' "origin/release"
}

# Fetch bundle.sh from resolve_bundle_sh_git_ref into dest_path.
fetch_bundle_sh() {
    local dest_path=$1
    local git_ref
    local tmp_path
    git_ref="$(resolve_bundle_sh_git_ref)"

    mkdir -p "$(dirname "${dest_path}")"
    tmp_path="$(mktemp "$(dirname "${dest_path}")/bundle.sh.XXXXXX")"

    log_info "Fetching bundle.sh from ref ${git_ref}..."

    cleanup_tmp() {
        rm -f "${tmp_path}"
    }
    trap cleanup_tmp RETURN

    if [[ "${git_ref}" == origin/* ]]; then
        # Best-effort refresh so we read the current remote branch, not a stale
        # remote-tracking ref left over from an earlier fetch.
        git fetch origin "${git_ref#origin/}" --depth 1 2>/dev/null || true
        git show "${git_ref}:bundle.sh" > "${tmp_path}" 2>/dev/null || true
    else
        git fetch origin "+refs/tags/${git_ref}:refs/tags/${git_ref}" --depth 1 2>/dev/null \
            || git fetch origin "${git_ref}" --depth 1 2>/dev/null \
            || true
        git show "${git_ref}:bundle.sh" > "${tmp_path}" 2>/dev/null || true
    fi

    if [[ -s "${tmp_path}" ]]; then
        mv "${tmp_path}" "${dest_path}"
        trap - RETURN
        log_success "Fetched bundle.sh from ${git_ref}"
        return 0
    fi

    log_error "Failed to fetch bundle.sh from ref ${git_ref}"
    return 1
}
