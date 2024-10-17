#!/bin/bash
set -euo pipefail

GH_LABEL="${1:-team-mmi}"
MMI_TEAM_SLUG="${2:-mmi}"

# Check if this is a PR
if [ -z "${CIRCLE_PULL_REQUEST}" ]; then
  echo "Not a pull request. Skipping MMI trigger."
  echo "run_mmi_tests=false" > mmi_trigger.env
  exit 0
fi

PR_NUMBER=$(echo "${CIRCLE_PULL_REQUEST}" | awk -F'/' '{print $NF}')
REPO="${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}"

# Fetch PR details using GitHub API
PR_RESPONSE=$(curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}")

# Check for specific label
HAS_MMI_LABEL=$(echo "${PR_RESPONSE}" | jq -r --arg label "${GH_LABEL}" '.labels[] | select(.name == $label) | .name' || true)

# Check if specific team is requested as reviewer
MMI_TEAM_REQUESTED=$(echo "${PR_RESPONSE}" | jq -r --arg team "${MMI_TEAM_SLUG}" '.requested_teams[]?.slug | select(. == $team)' || true)

if [[ -n "${HAS_MMI_LABEL}" || -n "${MMI_TEAM_REQUESTED}" ]]; then
  echo "run_mmi_tests=true" > mmi_trigger.env
else
  echo "run_mmi_tests=false" > mmi_trigger.env
fi
