#!/usr/bin/env bash
# Match a published CWS distribution channel by crxVersion (INFRA-3651).
# Reads FETCH_STATUS_JSON, CRX_VERSION, optional CRX_VERSION_ALT.
# Sets GITHUB_OUTPUT matched_crx_version and current_percentage on success.
set -euo pipefail

FETCH_STATUS_JSON="${FETCH_STATUS_JSON:?}"
CRX_VERSION="${CRX_VERSION:?}"
CRX_VERSION_ALT="${CRX_VERSION_ALT:-}"

match_channel() {
  local ver="$1"
  jq -c --arg ver "${ver}" '
    (.publishedItemRevisionStatus.distributionChannels // [])
    | map(select(.crxVersion == $ver))
    | first // empty
  ' "${FETCH_STATUS_JSON}"
}

published_channel="$(match_channel "${CRX_VERSION}")"
matched_crx="${CRX_VERSION}"

if [[ -z "${published_channel}" || "${published_channel}" == "null" ]]; then
  if [[ -n "${CRX_VERSION_ALT}" ]]; then
    published_channel="$(match_channel "${CRX_VERSION_ALT}")"
    if [[ -n "${published_channel}" && "${published_channel}" != "null" ]]; then
      matched_crx="${CRX_VERSION_ALT}"
    fi
  fi
fi

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
  echo "::error::Published revision for version ${matched_crx} has no deployPercentage."
  cat "${FETCH_STATUS_JSON}"
  exit 1
fi

{
  echo "matched_crx_version=${matched_crx}"
  echo "current_percentage=${current_pct}"
} >> "${GITHUB_OUTPUT}"
echo "Current rollout for crxVersion ${matched_crx}: ${current_pct}%"
