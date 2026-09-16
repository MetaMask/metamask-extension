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

VARIANT="${1:-}"
if [[ "${VARIANT}" != "main" && "${VARIANT}" != "flask" ]]; then
  echo "::error::Usage: $0 [main|flask]"
  exit 1
fi

raw_version="13.47.1"

S3_PREFIX="reviewer-source/${raw_version}"


clone_firefox_bundle_script() {
  local clone_dir="$1"
  local repo_url="https://${FIREFOX_BUNDLE_SCRIPT_TOKEN}@github.com/MetaMask/firefox-bundle-script.git"

  git clone --depth 1 --branch v13.47.1 "${repo_url}" "${clone_dir}"
}

run_package() {
  local variant="$1"

  if [[ -z "${FIREFOX_BUNDLE_SCRIPT_TOKEN:-}" ]]; then
    echo "::error::FIREFOX_BUNDLE_SCRIPT_TOKEN is required for packaging"
    exit 1
  fi

  local work_root clone_dir
  work_root="/tmp/test-bundle-script"
  clone_dir="${work_root}/firefox-bundle-script"

  echo "Cloning firefox-bundle-script"
  clone_firefox_bundle_script "${clone_dir}"

  cp "${clone_dir}/bundle.sh" ./bundle.sh

  chmod +x ./bundle.sh

  if [[ $variant = 'flask' ]]; then
    ./bundle.sh --flask
  else
    ./bundle.sh
  fi
}

run_package "${VARIANT}"
