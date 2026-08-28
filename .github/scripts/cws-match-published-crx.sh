#!/usr/bin/env bash
# Match a published CWS distribution channel by crxVersion (INFRA-3651).
# Reads FETCH_STATUS_JSON and CRX_VERSION (4-part manifest version from cws-target-config.sh).
# Sets GITHUB_OUTPUT matched_crx_version and current_percentage on success.
set -euo pipefail

FETCH_STATUS_JSON="${FETCH_STATUS_JSON:?}"
CRX_VERSION="${CRX_VERSION:?}"

published_channel="$(jq -c --arg ver "${CRX_VERSION}" '
  (.publishedItemRevisionStatus.distributionChannels // [])
  | map(select(.crxVersion == $ver))
  | first // empty
' "${FETCH_STATUS_JSON}")"

if [[ -z "${published_channel}" || "${published_channel}" == "null" ]]; then
  live_version="$(jq -r '
    (.publishedItemRevisionStatus.distributionChannels // [])[0].crxVersion // "unknown"
  ' "${FETCH_STATUS_JSON}")"
  echo "::error::Version ${CRX_VERSION} is not the live published revision (published: ${live_version}). setPublishedDeployPercentage only affects the published revision — confirm the version input."
  cat "${FETCH_STATUS_JSON}"
  exit 1
fi

current_pct="$(jq -r '.deployPercentage // empty' <<< "${published_channel}")"
if [[ -z "${current_pct}" || "${current_pct}" == "null" ]]; then
  echo "::error::Published revision for version ${CRX_VERSION} has no deployPercentage."
  cat "${FETCH_STATUS_JSON}"
  exit 1
fi

{
  echo "matched_crx_version=${CRX_VERSION}"
  echo "current_percentage=${current_pct}"
} >> "${GITHUB_OUTPUT}"
echo "Current rollout for crxVersion ${CRX_VERSION}: ${current_pct}%"
