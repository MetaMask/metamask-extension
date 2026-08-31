#!/usr/bin/env bash
# Plan submit-for-review vs publish-staged for cws-publish.yml (INFRA-3881).
#
# Inputs (env): FETCH_STATUS_JSON, CRX_VERSION, OPERATION (submit-for-review|publish-staged),
#               PUBLISH_TYPE (immediate|deferred; submit only), PERCENTAGE (1–100; submit only)
# Outputs (GITHUB_OUTPUT): action, branch; api_publish_type when submitting for review
set -euo pipefail

FETCH_STATUS_JSON="${FETCH_STATUS_JSON:?}"
CRX_VERSION="${CRX_VERSION:?}"
OPERATION="${OPERATION:?}"
PUBLISH_TYPE="${PUBLISH_TYPE:-}"
PERCENTAGE="${PERCENTAGE:-}"

submitted_state="$(jq -r '.submittedItemRevisionStatus.state // empty' "${FETCH_STATUS_JSON}")"
submitted_crx="$(jq -r '
  (.submittedItemRevisionStatus.distributionChannels // [])[0].crxVersion // empty
' "${FETCH_STATUS_JSON}")"
published_crx="$(jq -r '
  (.publishedItemRevisionStatus.distributionChannels // [])[0].crxVersion // empty
' "${FETCH_STATUS_JSON}")"
async_state="$(jq -r '.lastAsyncUploadState // empty' "${FETCH_STATUS_JSON}")"

if [[ "${published_crx}" == "${CRX_VERSION}" ]]; then
  echo "::error::Version ${CRX_VERSION} is already the live published revision. Use adjust-cws-rollout.yml to change rollout percentage."
  exit 1
fi

if [[ "${OPERATION}" == "publish-staged" ]]; then
  if [[ "${submitted_state}" != "STAGED" || "${submitted_crx}" != "${CRX_VERSION}" ]]; then
    echo "::error::No STAGED revision for crxVersion ${CRX_VERSION} (state=${submitted_state:-<none>}, submitted crx=${submitted_crx:-<none>}). Submit for review first."
    cat "${FETCH_STATUS_JSON}"
    exit 1
  fi
  {
    echo "action=publish-staged"
    echo "branch=Publish staged revision ${CRX_VERSION} to users"
  } >> "${GITHUB_OUTPUT}"
  exit 0
fi

if [[ "${OPERATION}" != "submit-for-review" ]]; then
  echo "::error::operation must be submit-for-review or publish-staged (got: ${OPERATION})."
  exit 1
fi

if [[ -n "${PERCENTAGE}" && ! "${PERCENTAGE}" =~ ^[0-9]+$ ]]; then
  echo "::error::percentage must be an integer between 1 and 100."
  exit 1
fi

if [[ -z "${PUBLISH_TYPE}" || -z "${PERCENTAGE}" ]]; then
  echo "::error::submit-for-review requires publish_type (immediate or deferred) and percentage (1–100)."
  exit 1
fi

if [[ "${PUBLISH_TYPE}" != "immediate" && "${PUBLISH_TYPE}" != "deferred" ]]; then
  echo "::error::publish_type must be immediate or deferred (got: ${PUBLISH_TYPE})."
  exit 1
fi

if (( PERCENTAGE < 1 || PERCENTAGE > 100 )); then
  echo "::error::percentage must be an integer between 1 and 100."
  exit 1
fi

if [[ "${submitted_state}" == "PENDING_REVIEW" && "${submitted_crx}" == "${CRX_VERSION}" ]]; then
  echo "::error::Version ${CRX_VERSION} is already pending Google review."
  exit 1
fi

# After upload-only, submittedItemRevisionStatus is usually unset until :publish; lastAsyncUploadState=SUCCEEDED is the draft signal.
draft_ready=false
if [[ "${async_state}" == "SUCCEEDED" && -z "${submitted_crx}" ]]; then
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
  echo "action=submit-for-review"
  echo "api_publish_type=${api_publish_type}"
  echo "branch=Submit ${CRX_VERSION} for review (${PUBLISH_TYPE}, ${PERCENTAGE}%)"
} >> "${GITHUB_OUTPUT}"
