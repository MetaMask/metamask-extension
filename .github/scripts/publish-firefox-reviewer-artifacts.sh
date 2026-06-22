#!/usr/bin/env bash
# Package and/or upload AMO reviewer source + approval notes to private S3 (INFRA-3683).
#
# Usage:
#   publish-firefox-reviewer-artifacts.sh package
#   publish-firefox-reviewer-artifacts.sh upload
#
# package — clone firefox-bundle-script, compare builds, create submission package.
# upload  — s3 cp artifacts (requires AMO_REVIEWER_BUCKET + active AWS creds from OIDC).
#
# Environment:
#   RELEASE_TAG                  — e.g. v13.37.0 (required)
#   FIREFOX_BUNDLE_SCRIPT_TOKEN    — clone private repo + read release branch bundle.sh
#   FIREFOX_BUNDLE_SCRIPT_REF      — git ref (default: main)
#   AMO_REVIEWER_PACKAGE_ROOT      — output root (default: $RUNNER_TEMP/amo-reviewer-artifacts)
#   AMO_REVIEWER_BUCKET            — required for upload
#   AWS_DEFAULT_REGION             — default us-east-2

set -euo pipefail

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

ensure_mtree() {
  if command -v mtree >/dev/null 2>&1; then
    return
  fi
  echo "Installing mtree for build comparison..."
  sudo apt-get update -qq
  sudo apt-get install -y mtree
}

resolve_last_listed_version() {
  if [[ -n "${AMO_LAST_LISTED_VERSION:-}" ]]; then
    echo "${AMO_LAST_LISTED_VERSION}"
    return
  fi
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

run_package() {
  if [[ -z "${FIREFOX_BUNDLE_SCRIPT_TOKEN:-}" ]]; then
    echo "::error::FIREFOX_BUNDLE_SCRIPT_TOKEN is required for packaging"
    exit 1
  fi

  ensure_mtree

  local work_root script_ref clone_dir bundle_dir work_dir last_listed
  work_root="$(mktemp -d)"
  script_ref="${FIREFOX_BUNDLE_SCRIPT_REF:-main}"
  clone_dir="${work_root}/firefox-bundle-script"
  work_dir="${work_root}/work"

  mkdir -p "${work_dir}" "${PACKAGE_DIR}"

  echo "Cloning firefox-bundle-script at ref ${script_ref}..."
  git clone --depth 1 --branch "${script_ref}" \
    "https://${FIREFOX_BUNDLE_SCRIPT_TOKEN}@github.com/MetaMask/firefox-bundle-script.git" \
    "${clone_dir}" 2>/dev/null || {
    git clone "https://${FIREFOX_BUNDLE_SCRIPT_TOKEN}@github.com/MetaMask/firefox-bundle-script.git" "${clone_dir}"
    git -C "${clone_dir}" checkout "${script_ref}"
  }

  echo "Fetching populated bundle.sh from release branch..."
  git -C "${clone_dir}" fetch origin release --depth 1
  git -C "${clone_dir}" show "origin/release:bundle.sh" > "${work_root}/bundle.sh"
  chmod +x "${work_root}/bundle.sh"

  echo "Comparing production vs locally rebuilt Firefox build..."
  bash "${clone_dir}/scripts/compare_builds.sh" "${raw_version}" "${work_dir}"

  last_listed="$(resolve_last_listed_version)"
  echo "Using last listed version: ${last_listed}"

  bash "${clone_dir}/scripts/create_submission_package.sh" "${raw_version}" "${last_listed}" "${work_dir}"

  local submission_dir source_zip notes_file
  submission_dir="${clone_dir}/output/submission_v${raw_version}"
  source_zip="${submission_dir}/metamask-extension-${raw_version}.zip"
  notes_file="${submission_dir}/reviewer_instructions_v${raw_version}.txt"

  if [[ ! -f "${source_zip}" || ! -f "${notes_file}" ]]; then
    echo "::error::Expected package files missing under ${submission_dir}"
    exit 1
  fi

  cp "${source_zip}" "${PACKAGE_DIR}/metamask-firefox-${raw_version}-source.zip"
  cp "${notes_file}" "${PACKAGE_DIR}/metamask-firefox-${raw_version}-amo-approval-notes.txt"

  echo "Packaged reviewer artifacts:"
  echo "  ${PACKAGE_DIR}/metamask-firefox-${raw_version}-source.zip"
  echo "  ${PACKAGE_DIR}/metamask-firefox-${raw_version}-amo-approval-notes.txt"

  rm -rf "${work_root}"
}

run_upload() {
  if [[ -z "${AMO_REVIEWER_BUCKET:-}" ]]; then
    echo "::error::AMO_REVIEWER_BUCKET is required for upload"
    exit 1
  fi

  local source_key notes_key source_path notes_path
  source_path="${PACKAGE_DIR}/metamask-firefox-${raw_version}-source.zip"
  notes_path="${PACKAGE_DIR}/metamask-firefox-${raw_version}-amo-approval-notes.txt"

  if [[ ! -f "${source_path}" || ! -f "${notes_path}" ]]; then
    echo "::error::Package files not found in ${PACKAGE_DIR}. Run package step first."
    exit 1
  fi

  source_key="${S3_PREFIX}/metamask-firefox-${raw_version}-source.zip"
  notes_key="${S3_PREFIX}/metamask-firefox-${raw_version}-amo-approval-notes.txt"

  echo "Uploading to s3://${AMO_REVIEWER_BUCKET}/${source_key}"
  aws s3 cp "${source_path}" "s3://${AMO_REVIEWER_BUCKET}/${source_key}" --region "${AWS_DEFAULT_REGION}"

  echo "Uploading to s3://${AMO_REVIEWER_BUCKET}/${notes_key}"
  aws s3 cp "${notes_path}" "s3://${AMO_REVIEWER_BUCKET}/${notes_key}" --region "${AWS_DEFAULT_REGION}"

  echo "Reviewer artifacts uploaded to s3://${AMO_REVIEWER_BUCKET}/${S3_PREFIX}/"
}

case "${MODE}" in
  package) run_package ;;
  upload) run_upload ;;
esac
