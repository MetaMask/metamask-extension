#!/usr/bin/env bash
# Shared CWS listing + WIF resolution for human-initiated workflows (INFRA-3651 / INFRA-3881).
# Maps release semver input to CWS crxVersion (manifest "version", always 4-part) — see development/webpack/utils/version.ts.
set -euo pipefail

TARGET="${TARGET:?}"
VERSION="${VERSION:?}"

# Flask build id from builds.yml (flask.id); release .0 → fourth segment 150 (id + releaseVersion).
readonly FLASK_BUILD_ID=15
readonly FLASK_RELEASE_VERSION=0

if [[ ! "${VERSION}" =~ ^[0-9]+(\.[0-9]+){0,3}$ ]]; then
  echo "::error::Invalid version format: ${VERSION} — use 1–4 dot-separated integers (e.g. 13.43.0 or 13.43.0.0)"
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

case "${TARGET}" in
  dev)
    WIF_PROVIDER="${WIF_PROVIDER_DEV:?}"
    WIF_SERVICE_ACCOUNT="${WIF_SERVICE_ACCOUNT_DEV:?}"
    EXTENSION_ID="${EXTENSION_ID_DEV:?}"
    PUBLISHER_ID="${PUBLISHER_ID_DEV:?}"
    ;;
  production)
    WIF_PROVIDER="${WIF_PROVIDER_PROD:?}"
    WIF_SERVICE_ACCOUNT="${WIF_SERVICE_ACCOUNT_PROD:?}"
    EXTENSION_ID="${EXTENSION_ID_PROD:?}"
    PUBLISHER_ID="${PUBLISHER_ID_PROD:?}"
    ;;
  flask)
    WIF_PROVIDER="${WIF_PROVIDER_PROD:?}"
    WIF_SERVICE_ACCOUNT="${WIF_SERVICE_ACCOUNT_PROD:?}"
    EXTENSION_ID="${EXTENSION_ID_FLASK:?}"
    PUBLISHER_ID="${PUBLISHER_ID_FLASK:?}"
    ;;
  *)
    echo "::error::Invalid target: ${TARGET}"
    exit 1
    ;;
esac

if [[ "${TARGET}" == "flask" ]]; then
  if [[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    CRX_VERSION="${VERSION}"
  elif [[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    CRX_VERSION="${VERSION}.${FLASK_BUILD_ID}${FLASK_RELEASE_VERSION}"
  else
    echo "::error::Flask target expects release semver (e.g. 13.43.0) or full crxVersion (e.g. 13.43.0.150)"
    exit 1
  fi
else
  if [[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    CRX_VERSION="${VERSION}"
  elif [[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    CRX_VERSION="${VERSION}.0"
  else
    echo "::error::Production/dev expects release semver (e.g. 13.43.0) or full crxVersion (e.g. 13.43.0.0)"
    exit 1
  fi
fi

{
  echo "WIF_PROVIDER=${WIF_PROVIDER}"
  echo "WIF_SERVICE_ACCOUNT=${WIF_SERVICE_ACCOUNT}"
  echo "EXTENSION_ID=${EXTENSION_ID}"
  echo "PUBLISHER_ID=${PUBLISHER_ID}"
  echo "CRX_VERSION=${CRX_VERSION}"
} >> "${GITHUB_ENV}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "target=${TARGET}"
    echo "extension_id=${EXTENSION_ID}"
    echo "publisher_id=${PUBLISHER_ID}"
    echo "crx_version=${CRX_VERSION}"
  } >> "${GITHUB_OUTPUT}"
fi
