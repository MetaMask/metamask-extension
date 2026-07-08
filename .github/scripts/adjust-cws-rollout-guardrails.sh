#!/usr/bin/env bash
# INFRA-3651 — evaluate rollout guardrails; report every violation before exit.
set -euo pipefail

DESIRED="${DESIRED_PERCENTAGE:?}"
CURRENT="${CURRENT_PERCENTAGE:?}"
CONFIRM="${CONFIRM_FULL_ROLLOUT:-}"

violations=()

if ! [[ "${DESIRED}" =~ ^[0-9]+$ ]]; then
  violations+=("desired_percentage must be an integer between 1 and 100")
elif (( DESIRED < 1 || DESIRED > 100 )); then
  violations+=("desired_percentage must be between 1 and 100")
fi

if ! [[ "${CURRENT}" =~ ^[0-9]+$ ]]; then
  violations+=("current_percentage from CWS must be an integer between 1 and 100")
elif (( CURRENT < 1 || CURRENT > 100 )); then
  violations+=("current_percentage from CWS must be between 1 and 100")
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

  if (( DESIRED < CURRENT )); then
    violations+=("Rollback is not permitted via this workflow. Use the CWS dashboard and open a post-incident review.")
  fi

  if (( DESIRED == 100 )) && [[ "${CONFIRM}" != "yes" ]]; then
    violations+=("Setting rollout to 100% requires confirm_full_rollout: 'yes'")
  fi

  delta=$(( DESIRED - CURRENT ))
  if (( delta > 50 )) && [[ "${CONFIRM}" != "yes" ]]; then
    violations+=("Single-step increase of ${delta}% exceeds the 50-point maximum. Increase in stages or pass confirm_full_rollout: 'yes' to override.")
  fi
fi

if ((${#violations[@]} > 0)); then
  for msg in "${violations[@]}"; do
    echo "::error::${msg}"
  done
  exit 1
fi

echo "All rollout guardrails passed (current=${CURRENT}%, desired=${DESIRED}%)."
