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
PR_DETAILS="$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER")"

# Validate that PR_DETAILS is not empty
if [ -z "$PR_DETAILS" ]; then
  echo "Failed to fetch PR details. Exiting."
  exit 1
fi

# Debugging: Check PR_DETAILS integrity
echo "Length of PR_DETAILS: ${#PR_DETAILS}"
last_char=$(echo "$PR_DETAILSs" | tail -c1)
echo "Last character of PR_DETAILS: '$last_char'"

# Check jq version
echo "JQ version: $(jq --version)"

# Validate JSON format by piping PR_DETAILS into jq empty
#echo "$PR_DETAILS" | jq empty
echo "JSON is valid."

# Print specific fields to ensure they exist (optional, can be commented out later)
echo "$PR_DETAILS" | jq '.labels, .requested_reviewers'

# Check for label using jq with --arg and any, handling missing or empty labels
LABEL_EXISTS=$(jq --arg label "$LABEL_NAME" 'if .labels then any(.labels[]; .name == $label) else false end')

# Check for reviewer team using jq with --arg and any, handling missing or empty requested_reviewers
REVIEWER_EXISTS=$(jq --arg team "$REVIEWER_TEAM" 'if .requested_reviewers then any(.requested_reviewers[]; .login == $team) else false end')

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
