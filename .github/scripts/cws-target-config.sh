#!/usr/bin/env bash
# Resolve CWS listing + WIF credentials for human-initiated workflows (INFRA-3651 / INFRA-3881).
#
# Inputs (env): TARGET (dev|production|flask), VERSION (release semver X.Y.Z only)
# Outputs (GITHUB_ENV): WIF_PROVIDER, WIF_SERVICE_ACCOUNT, EXTENSION_ID, PUBLISHER_ID, CRX_VERSION
#
# CRX_VERSION is the 4-part Chrome manifest "version" (see development/webpack/utils/version.ts):
#   production/dev → X.Y.Z.0, flask → X.Y.Z.150 (build id 15 + release 0).
set -euo pipefail

TARGET="${TARGET:?}"
VERSION="${VERSION:?}"

readonly FLASK_BUILD_ID=15
readonly FLASK_RELEASE_VERSION=0

if [[ ! "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "::error::Invalid version: ${VERSION} — use release semver X.Y.Z (e.g. 13.43.0)"
  exit 1
fi

IFS='.' read -r -a version_parts <<< "${VERSION}"
for part in "${version_parts[@]}"; do
  if [[ ! "${part}" =~ ^(0|[1-9][0-9]*)$ ]]; then
    echo "::error::Version segment must be a non-negative integer without leading zeros: ${part} in ${VERSION}"
    exit 1
  fi
  if (( part > 65535 )); then
    echo "::error::Version segment out of range (0–65535): ${part} in ${VERSION}"
    exit 1
  fi
done

case "${TARGET}" in
  dev)
    WIF_PROVIDER="${WIF_PROVIDER_DEV:?}"
    WIF_SERVICE_ACCOUNT="${WIF_SERVICE_ACCOUNT_DEV:?}"
    EXTENSION_ID="${EXTENSION_ID_DEV:?}"
    PUBLISHER_ID="${PUBLISHER_ID_DEV:?}"
    CRX_VERSION="${VERSION}.0"
    ;;
  production)
    WIF_PROVIDER="${WIF_PROVIDER_PROD:?}"
    WIF_SERVICE_ACCOUNT="${WIF_SERVICE_ACCOUNT_PROD:?}"
    EXTENSION_ID="${EXTENSION_ID_PROD:?}"
    PUBLISHER_ID="${PUBLISHER_ID_PROD:?}"
    CRX_VERSION="${VERSION}.0"
    ;;
  flask)
    WIF_PROVIDER="${WIF_PROVIDER_PROD:?}"
    WIF_SERVICE_ACCOUNT="${WIF_SERVICE_ACCOUNT_PROD:?}"
    EXTENSION_ID="${EXTENSION_ID_FLASK:?}"
    PUBLISHER_ID="${PUBLISHER_ID_FLASK:?}"
    CRX_VERSION="${VERSION}.${FLASK_BUILD_ID}${FLASK_RELEASE_VERSION}"
    ;;
  *)
    echo "::error::Invalid target: ${TARGET}"
    exit 1
    ;;
esac

{
  echo "WIF_PROVIDER=${WIF_PROVIDER}"
  echo "WIF_SERVICE_ACCOUNT=${WIF_SERVICE_ACCOUNT}"
  echo "EXTENSION_ID=${EXTENSION_ID}"
  echo "PUBLISHER_ID=${PUBLISHER_ID}"
  echo "CRX_VERSION=${CRX_VERSION}"
} >> "${GITHUB_ENV}"
