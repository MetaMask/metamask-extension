#!/bin/bash
set -eo pipefail

# Arguments: label_name reviewer_team
LABEL_NAME="$1"
REVIEWER_TEAM="$2"

# Ensure required environment variables are set
if [ -z "$CIRCLE_PULL_REQUEST" ] || [ -z "$GITHUB_TOKEN" ]; then
  echo "CIRCLE_PULL_REQUEST and GITHUB_TOKEN must be set."
  exit 1
fi

# Extract PR number from the pull request URL
PR_NUMBER=$(echo "$CIRCLE_PULL_REQUEST" | awk -F'/' '{print $NF}')

# Define repository details
REPO_OWNER="$CIRCLE_PROJECT_USERNAME"
REPO_NAME=$(basename "$CIRCLE_REPOSITORY_URL" .git)

echo "Fetching details for PR #$PR_NUMBER in repository $REPO_OWNER/$REPO_NAME."

# Fetch PR details using GitHub API
PR_DETAILS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER")

# Check for label using jq
LABEL_EXISTS=$(echo "$PR_DETAILS" | jq -r --arg label "$LABEL_NAME" '.labels | map(.name) | contains([$label])')

# Check for reviewer team
REVIEWER_EXISTS=$(echo "$PR_DETAILS" | jq -r --arg team "$REVIEWER_TEAM" '.requested_reviewers | map(.login) | contains([$team])')

echo "Label Exists: $LABEL_EXISTS"
echo "Reviewer Exists: $REVIEWER_EXISTS"

# Check if either condition is met
if [[ "$LABEL_EXISTS" == "true" || "$REVIEWER_EXISTS" == "true" ]]; then
  echo "run_mmi_tests=true" > mmi_trigger.env
  echo "Conditions met: Label '$LABEL_NAME' found or Reviewer '$REVIEWER_TEAM' assigned."
else
  echo "run_mmi_tests=false" > mmi_trigger.env
  echo "Conditions not met: Label '$LABEL_NAME' not found and Reviewer '$REVIEWER_TEAM' not assigned."
fi
