#!/usr/bin/env bash
# Package and/or upload AMO reviewer source + approval notes to private S3 (INFRA-3683).
#
# Usage:
#   publish-firefox-reviewer-artifacts.sh package
#   publish-firefox-reviewer-artifacts.sh upload
#
# package — clone firefox-bundle-script and run prepare_release.sh for production
#           and Flask to create submission packages.
# upload  — s3 cp artifacts (requires AMO_REVIEWER_BUCKET + active AWS creds from OIDC).
#
# Environment:
#   RELEASE_TAG                  — e.g. v13.37.0 (required)
#   FIREFOX_BUNDLE_SCRIPT_TOKEN  — clone private repo + fetch bundle.sh tags
#   AMO_REVIEWER_PACKAGE_ROOT    — output root (default: $RUNNER_TEMP/amo-reviewer-artifacts)
#   AMO_REVIEWER_BUCKET          — required for upload
#   AWS_DEFAULT_REGION             — default us-east-2

set -euo pipefail

# Pin firefox-bundle-script tooling (prepare_release.sh + scripts). Bump via PR
# when tooling changes; merge MetaMask/firefox-bundle-script before release use.
# INFRA-3753: includes FIREFOX_BUNDLE_SH_GIT_REF / per-version tag support.
FIREFOX_BUNDLE_SCRIPT_REF="1cb37c0817b319d9846dbca827d533e0ae769984"

MODE="${1:-}"
if [[ "${MODE}" != "package" && "${MODE}" != "upload" ]]; then
  echo "::error::Usage: $0 package|upload"
  exit 1
fi

if [[ -z "${RELEASE_TAG:-}" ]]; then
  echo "::error::RELEASE_TAG is required"
  exit 1
fi

raw_version="${RELEASE_TAG#v}"
if [[ -z "${raw_version}" || "${raw_version}" == "${RELEASE_TAG}" ]]; then
  echo "::error::RELEASE_TAG must look like vX.Y.Z (got '${RELEASE_TAG}')"
  exit 1
fi

AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-2}"
PACKAGE_ROOT="${AMO_REVIEWER_PACKAGE_ROOT:-${RUNNER_TEMP:-/tmp}/amo-reviewer-artifacts}"
PACKAGE_DIR="${PACKAGE_ROOT}/${raw_version}"
S3_PREFIX="reviewer-source/${raw_version}"
FIREFOX_BUNDLE_SH_GIT_REF="v${raw_version}"

ensure_mtree() {
  if command -v mtree >/dev/null 2>&1; then
    return
  fi
  echo "Installing mtree for build comparison..."
  sudo apt-get update -qq
  sudo apt-get install -y mtree
}

resolve_last_listed_version() {
  # Best-effort for reviewer notes at release time (previous semver tag).
  # Authoritative last-listed version at submit time comes from the Lambda
  # (fetchLastListedVersion against the live AMO listing).
  local previous
  previous="$(git -C "${GITHUB_WORKSPACE:-.}" tag -l 'v*' --sort=-v:refname 2>/dev/null \
    | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
    | grep -v "^v${raw_version}$" \
    | head -1 \
    | sed 's/^v//' || true)"
  if [[ -z "${previous}" ]]; then
    echo "${raw_version}"
  else
    echo "${previous}"
  fi
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
  if [[ -z "${FIREFOX_BUNDLE_SCRIPT_TOKEN:-}" ]]; then
    echo "::error::FIREFOX_BUNDLE_SCRIPT_TOKEN is required for packaging"
    exit 1
  fi

  ensure_mtree

  local work_root script_ref clone_dir last_listed
  work_root="$(mktemp -d)"
  trap 'rm -rf "${work_root}"' EXIT
  script_ref="${FIREFOX_BUNDLE_SCRIPT_REF}"
  clone_dir="${work_root}/firefox-bundle-script"

  mkdir -p "${PACKAGE_DIR}"

  echo "Cloning firefox-bundle-script at ref ${script_ref}..."
  clone_firefox_bundle_script "${script_ref}" "${clone_dir}"

  last_listed="$(resolve_last_listed_version)"
  echo "Using last listed version: ${last_listed}"

  package_release_variant main "${clone_dir}" "${last_listed}"
  package_release_variant flask "${clone_dir}" "${last_listed}"
}

run_upload() {
  if [[ -z "${AMO_REVIEWER_BUCKET:-}" ]]; then
    echo "::error::AMO_REVIEWER_BUCKET is required for upload"
    exit 1
  fi

  local required=(
    "${PACKAGE_DIR}/metamask-firefox-${raw_version}-source.zip"
    "${PACKAGE_DIR}/metamask-firefox-${raw_version}-amo-approval-notes.txt"
    "${PACKAGE_DIR}/metamask-firefox-${raw_version}-flask.0-source.zip"
    "${PACKAGE_DIR}/metamask-firefox-${raw_version}-flask.0-amo-approval-notes.txt"
  )

  local artifact
  for artifact in "${required[@]}"; do
    if [[ ! -f "${artifact}" ]]; then
      echo "::error::Package file not found: ${artifact}. Run package step first."
      exit 1
    fi
  done

  for artifact in "${required[@]}"; do
    local key
    key="${S3_PREFIX}/$(basename "${artifact}")"
    echo "Uploading to s3://${AMO_REVIEWER_BUCKET}/${key}"
    aws s3 cp "${artifact}" "s3://${AMO_REVIEWER_BUCKET}/${key}" --region "${AWS_DEFAULT_REGION}"
  done

  echo "Reviewer artifacts uploaded to s3://${AMO_REVIEWER_BUCKET}/${S3_PREFIX}/"
}

case "${MODE}" in
  package) run_package ;;
  upload) run_upload ;;
esac
