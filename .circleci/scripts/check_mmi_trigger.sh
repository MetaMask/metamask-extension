#!/bin/bash
set -eo pipefail

# Arguments: label_name reviewer_team
LABEL_NAME="$1"
REVIEWER_TEAM="$2"

# Enable debugging (optional; uncomment for debugging)
set -x

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

# Validate that PR_DETAILS is not empty
if [ -z "$PR_DETAILS" ]; then
  echo "Failed to fetch PR details. Exiting."
  exit 1
fi

# Check jq version
echo "JQ version: $(jq --version)"

# Validate JSON format
echo "$PR_DETAILS" | jq empty
echo "JSON is valid."

# Check for label using jq with --arg and any
LABEL_EXISTS=$(echo "$PR_DETAILS" | jq --arg label "$LABEL_NAME" 'any(.labels[]; .name == $label)')

# Check for reviewer team using jq with --arg and any
REVIEWER_EXISTS=$(echo "$PR_DETAILS" | jq --arg team "$REVIEWER_TEAM" 'any(.requested_reviewers[]; .login == $team)')

echo "Label Exists: $LABEL_EXISTS"
echo "Reviewer Exists: $REVIEWER_EXISTS"

# Determine if tests should run
if [[ "$LABEL_EXISTS" == "true" ]] || [[ "$REVIEWER_EXISTS" == "true" ]]; then
  echo "run_mmi_tests=true" > mmi_trigger.env
  echo "Conditions met: Label '$LABEL_NAME' found or Reviewer '$REVIEWER_TEAM' assigned."
else
  echo "run_mmi_tests=false" > mmi_trigger.env
  echo "Conditions not met: Label '$LABEL_NAME' not found and Reviewer '$REVIEWER_TEAM' not assigned."
fi
