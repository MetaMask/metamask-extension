#!/usr/bin/env bash
# Shared CWS listing + WIF resolution for human-initiated workflows (INFRA-3651 / INFRA-3881).
set -euo pipefail

TARGET="${TARGET:?}"
VERSION="${VERSION:?}"

if [[ ! "${VERSION}" =~ ^[0-9]+(\.[0-9]+){0,3}$ ]]; then
  echo "::error::Invalid version format: ${VERSION} — use 1–4 dot-separated integers (e.g. 13.43.0.0)"
  exit 1
fi

IFS='.' read -r -a version_parts <<< "${VERSION}"
for part in "${version_parts[@]}"; do
  if [[ ! "${part}" =~ ^(0|[1-9][0-9]*)$ ]]; then
    echo "::error::Version segment must be a non-negative integer without leading zeros: ${part} in ${VERSION}"
    exit 1
  fi
  if (( 10#${part} > 65535 )); then
    echo "::error::Version segment out of range (0–65535): ${part} in ${VERSION}"
    exit 1
  fi
done

if [[ "${TARGET}" == "dev" ]]; then
  WIF_PROVIDER="${WIF_PROVIDER_DEV:?}"
  WIF_SERVICE_ACCOUNT="${WIF_SERVICE_ACCOUNT_DEV:?}"
  EXTENSION_ID="${EXTENSION_ID_DEV:?}"
  PUBLISHER_ID="${PUBLISHER_ID_DEV:?}"
elif [[ "${TARGET}" == "production" ]]; then
  WIF_PROVIDER="${WIF_PROVIDER_PROD:?}"
  WIF_SERVICE_ACCOUNT="${WIF_SERVICE_ACCOUNT_PROD:?}"
  EXTENSION_ID="${EXTENSION_ID_PROD:?}"
  PUBLISHER_ID="${PUBLISHER_ID_PROD:?}"
elif [[ "${TARGET}" == "flask" ]]; then
  WIF_PROVIDER="${WIF_PROVIDER_PROD:?}"
  WIF_SERVICE_ACCOUNT="${WIF_SERVICE_ACCOUNT_PROD:?}"
  EXTENSION_ID="${EXTENSION_ID_FLASK:?}"
  PUBLISHER_ID="${PUBLISHER_ID_FLASK:?}"
else
  echo "::error::Invalid target: ${TARGET}"
  exit 1
fi

if [[ "${TARGET}" == "flask" ]]; then
  CRX_VERSION="${VERSION}-flask.0"
  CRX_VERSION_ALT=""
else
  CRX_VERSION="${VERSION}"
  if [[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    CRX_VERSION_ALT="${VERSION}.0"
  else
    CRX_VERSION_ALT=""
  fi
fi

{
  echo "WIF_PROVIDER=${WIF_PROVIDER}"
  echo "WIF_SERVICE_ACCOUNT=${WIF_SERVICE_ACCOUNT}"
  echo "EXTENSION_ID=${EXTENSION_ID}"
  echo "PUBLISHER_ID=${PUBLISHER_ID}"
  echo "CRX_VERSION=${CRX_VERSION}"
  echo "CRX_VERSION_ALT=${CRX_VERSION_ALT}"
} >> "${GITHUB_ENV}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "target=${TARGET}"
    echo "extension_id=${EXTENSION_ID}"
    echo "publisher_id=${PUBLISHER_ID}"
    echo "crx_version=${CRX_VERSION}"
    echo "crx_version_alt=${CRX_VERSION_ALT}"
  } >> "${GITHUB_OUTPUT}"
fi
