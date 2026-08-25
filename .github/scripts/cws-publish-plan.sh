#!/usr/bin/env bash
# Decide submit vs promote for cws-publish.yml (INFRA-3881).
set -euo pipefail

FETCH_STATUS_JSON="${FETCH_STATUS_JSON:?}"
CRX_VERSION="${CRX_VERSION:?}"
CRX_VERSION_ALT="${CRX_VERSION_ALT:-}"
PUBLISH_TYPE="${PUBLISH_TYPE:-}"
PERCENTAGE="${PERCENTAGE:-}"

channel_has_crx() {
  local channels_path="$1"
  local ver="$2"
  jq -e --arg ver "${ver}" "
    (${channels_path} // [])
    | map(.crxVersion)
    | index(\$ver) != null
  " "${FETCH_STATUS_JSON}" >/dev/null 2>&1
}

matches_expected_crx() {
  channel_has_crx "$1" "${CRX_VERSION}" || {
    [[ -n "${CRX_VERSION_ALT}" ]] && channel_has_crx "$1" "${CRX_VERSION_ALT}"
  }
}

submitted_state="$(jq -r '.submittedItemRevisionStatus.state // empty' "${FETCH_STATUS_JSON}")"
submitted_crx="$(jq -r '
  [
    .submittedItemRevisionStatus.distributionChannels[]?.crxVersion // empty
  ] | map(select(length > 0)) | first // empty
' "${FETCH_STATUS_JSON}")"
published_crx="$(jq -r '
  (.publishedItemRevisionStatus.distributionChannels // [])[0].crxVersion // empty
' "${FETCH_STATUS_JSON}")"
async_state="$(jq -r '.lastAsyncUploadState // empty' "${FETCH_STATUS_JSON}")"

if matches_expected_crx '.publishedItemRevisionStatus.distributionChannels'; then
  echo "::error::Version ${CRX_VERSION} is already the live published revision (crxVersion=${published_crx}). Use adjust-cws-rollout.yml to ramp."
  exit 1
fi

if [[ "${submitted_state}" == "STAGED" ]] && matches_expected_crx '.submittedItemRevisionStatus.distributionChannels'; then
  if [[ -n "${PUBLISH_TYPE}" || -n "${PERCENTAGE}" ]]; then
    echo "::error::Promote requires publish_type and percentage to be empty (state=STAGED, crxVersion=${submitted_crx})."
    exit 1
  fi
  {
    echo "action=promote"
    echo "branch=Promote staged revision ${submitted_crx} to live"
  } >> "${GITHUB_OUTPUT}"
  exit 0
fi

if [[ "${submitted_state}" == "PENDING_REVIEW" ]] && matches_expected_crx '.submittedItemRevisionStatus.distributionChannels'; then
  echo "::error::Version ${CRX_VERSION} is already pending Google review (crxVersion=${submitted_crx})."
  exit 1
fi

if [[ -z "${PUBLISH_TYPE}" || -z "${PERCENTAGE}" ]]; then
  echo "::error::Submit requires publish_type (immediate or deferred) and percentage (1–100)."
  exit 1
fi

if [[ "${PUBLISH_TYPE}" != "immediate" && "${PUBLISH_TYPE}" != "deferred" ]]; then
  echo "::error::publish_type must be immediate or deferred (got: ${PUBLISH_TYPE})."
  exit 1
fi

if ! [[ "${PERCENTAGE}" =~ ^[0-9]+$ ]] || (( PERCENTAGE < 1 || PERCENTAGE > 100 )); then
  echo "::error::percentage must be an integer between 1 and 100."
  exit 1
fi

draft_ready=false
if matches_expected_crx '.submittedItemRevisionStatus.distributionChannels' \
  && [[ "${submitted_state}" != "STAGED" && "${submitted_state}" != "PENDING_REVIEW" ]]; then
  draft_ready=true
fi

# ponytail: after :upload alone, submittedItemRevisionStatus may be unset (CWS API); SUCCEEDED upload still leaves a draft for :publish.
if [[ "${draft_ready}" != "true" && "${async_state}" == "SUCCEEDED" && -z "${submitted_crx}" ]]; then
  draft_ready=true
fi

if [[ "${draft_ready}" != "true" ]]; then
  echo "::error::No uploaded draft for version ${CRX_VERSION} (submitted state=${submitted_state:-<none>}, submitted crx=${submitted_crx:-<none>}, lastAsyncUploadState=${async_state:-<none>}). Run upload-extension-to-cws.yml first."
  cat "${FETCH_STATUS_JSON}"
  exit 1
fi

if [[ "${PUBLISH_TYPE}" == "immediate" ]]; then
  api_publish_type="DEFAULT_PUBLISH"
else
  api_publish_type="STAGED_PUBLISH"
fi

{
  echo "action=submit"
  echo "api_publish_type=${api_publish_type}"
  echo "branch=Submit ${CRX_VERSION} for review (${PUBLISH_TYPE}, ${PERCENTAGE}%)"
} >> "${GITHUB_OUTPUT}"
