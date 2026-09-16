#!/usr/bin/env bash
# Clone firefox-bundle-script and run prepare_release.sh for production
# or Flask to create submission packages.
#
# Usage:
#   package-firefox-reviewer-artifacts.sh main
#   package-firefox-reviewer-artifacts.sh flask
#
# Environment:
#   FIREFOX_BUNDLE_SCRIPT_TOKEN  — clone private repo + fetch bundle.sh tags

set -euo pipefail

# Pin firefox-bundle-script tooling (prepare_release.sh + scripts). Bump via PR
# when tooling changes; merge MetaMask/firefox-bundle-script before release use.
# INFRA-3753: includes FIREFOX_BUNDLE_SH_GIT_REF / per-version tag support.
FIREFOX_BUNDLE_SCRIPT_REF="1cb37c0817b319d9846dbca827d533e0ae769984"

VARIANT="${1:-}"
if [[ "${VARIANT}" != "main" && "${VARIANT}" != "flask" ]]; then
  echo "::error::Usage: $0 [main|flask]"
  exit 1
fi

raw_version="13.47.1"

PACKAGE_DIR="/tmp/amo-reviewer-artifacts/${raw_version}"
S3_PREFIX="reviewer-source/${raw_version}"
FIREFOX_BUNDLE_SH_GIT_REF="v${raw_version}"

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

clone_firefox_bundle_script() {
  local script_ref="$1"
  local clone_dir="$2"
  local repo_url="https://${FIREFOX_BUNDLE_SCRIPT_TOKEN}@github.com/MetaMask/firefox-bundle-script.git"

  if [[ "${script_ref}" =~ ^[0-9a-fA-F]{7,40}$ ]]; then
    git init "${clone_dir}"
    git -C "${clone_dir}" remote add origin "${repo_url}"
    git -C "${clone_dir}" fetch --depth 1 origin "${script_ref}"
    git -C "${clone_dir}" checkout FETCH_HEAD
  else
    git clone --depth 1 --branch "${script_ref}" "${repo_url}" "${clone_dir}"
  fi
}

package_release_variant() {
  local variant="$1"
  local clone_dir="$2"
  local last_listed="$3"

  local submission_dir_prefix source_dest notes_dest
  local -a prepare_args=()

  if [[ "${variant}" == "flask" ]]; then
    local flask_version="${raw_version}-flask.0"
    submission_dir_prefix="flask_submission"
    prepare_args=(--flask)
    source_dest="${PACKAGE_DIR}/metamask-firefox-${flask_version}-source.zip"
    notes_dest="${PACKAGE_DIR}/metamask-firefox-${flask_version}-amo-approval-notes.txt"
  else
    submission_dir_prefix="submission"
    source_dest="${PACKAGE_DIR}/metamask-firefox-${raw_version}-source.zip"
    notes_dest="${PACKAGE_DIR}/metamask-firefox-${raw_version}-amo-approval-notes.txt"
  fi

  mkdir -p "${PACKAGE_DIR}"

  # prepare_release.sh fetches bundle.sh at FIREFOX_BUNDLE_SH_GIT_REF (v{version} tag),
  # runs compare_builds.sh + create_submission_package.sh, and writes packages
  # under output/. Exits non-zero when reproduced build differs from published.
  echo "Packaging ${variant} reviewer artifacts via prepare_release.sh..."
  (
    cd "${clone_dir}"
    export FIREFOX_BUNDLE_SH_GIT_REF
    bash ./prepare_release.sh "${prepare_args[@]}" "${raw_version}" "${last_listed}"
  )

  local submission_dir source_zip notes_file
  submission_dir="${clone_dir}/output/${submission_dir_prefix}_v${raw_version}"
  source_zip="${submission_dir}/metamask-extension-${raw_version}.zip"
  notes_file="${submission_dir}/reviewer_instructions_v${raw_version}.txt"

  if [[ ! -f "${source_zip}" || ! -f "${notes_file}" ]]; then
    echo "::error::Expected ${variant} package files missing under ${submission_dir}"
    exit 1
  fi

  cp "${source_zip}" "${source_dest}"
  cp "${notes_file}" "${notes_dest}"

  echo "Packaged ${variant} reviewer artifacts:"
  echo "  ${source_dest}"
  echo "  ${notes_dest}"
}

run_package() {
  local variant="$1"

  if [[ -z "${FIREFOX_BUNDLE_SCRIPT_TOKEN:-}" ]]; then
    echo "::error::FIREFOX_BUNDLE_SCRIPT_TOKEN is required for packaging"
    exit 1
  fi

  ensure_mtree

  local work_root script_ref clone_dir last_listed
  work_root="$(mktemp -d)"
  # Expand the path when registering the trap. With set -u, a trap that refs a
  # function-local on EXIT runs after the local is unbound and fails the job.
  # Shellcheck: Early expansion is intentional here
  # shellcheck disable=SC2064
  trap "rm -rf \"${work_root}\"" EXIT
  script_ref="${FIREFOX_BUNDLE_SCRIPT_REF}"
  clone_dir="${work_root}/firefox-bundle-script"

  mkdir -p "${PACKAGE_DIR}"

  echo "Cloning firefox-bundle-script at ref ${script_ref}..."
  clone_firefox_bundle_script "${script_ref}" "${clone_dir}"

  last_listed="13.47.0"
  echo "Using last listed version: ${last_listed}"

  package_release_variant "${variant}" "${clone_dir}" "${last_listed}"
}

run_package "${VARIANT}"
