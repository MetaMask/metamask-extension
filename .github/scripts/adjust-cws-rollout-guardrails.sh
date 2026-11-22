#!/usr/bin/env bash
# INFRA-3651 — evaluate rollout guardrails; report every violation before exit.
set -euo pipefail

DESIRED="${DESIRED_PERCENTAGE:?}"
CURRENT="${CURRENT_PERCENTAGE:?}"

violations=()

if ! [[ "${DESIRED}" =~ ^[0-9]+$ ]]; then
  violations+=("desired_percentage must be an integer between 1 and 100")
elif (( DESIRED < 1 || DESIRED > 100 )); then
  violations+=("desired_percentage must be between 1 and 100")
fi

if ! [[ "${CURRENT}" =~ ^[0-9]+$ ]]; then
  violations+=("current_percentage from CWS must be an integer between 0 and 100")
elif (( CURRENT < 0 || CURRENT > 100 )); then
  violations+=("current_percentage from CWS must be between 0 and 100")
fi

if [[ "${CURRENT}" =~ ^[0-9]+$ && "${DESIRED}" =~ ^[0-9]+$ ]]; then
  if [[ "${DESIRED}" == "${CURRENT}" ]]; then
    if ((${#violations[@]} > 0)); then
      for msg in "${violations[@]}"; do
        echo "::error::${msg}"
      done
      exit 1
    fi
    echo "No-op: desired percentage (${DESIRED}%) matches current (${CURRENT}%)."
    exit 0
  fi

  # Defense-in-depth: CWS API also rejects DESIRED <= CURRENT natively
  # (setPublishedDeployPercentage requires deployPercentage > current).
  # We check here first to surface a clear error rather than a raw API 4xx.
  if (( DESIRED < CURRENT )); then
    violations+=("Rollback is not permitted via this workflow. Use the CWS dashboard and open a post-incident review.")
  fi
fi

if ((${#violations[@]} > 0)); then
  for msg in "${violations[@]}"; do
    echo "::error::${msg}"
  done
  exit 1
fi

echo "All rollout guardrails passed (current=${CURRENT}%, desired=${DESIRED}%)."
