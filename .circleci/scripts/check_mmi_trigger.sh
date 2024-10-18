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

# Check for label using jq
LABEL_EXISTS=$(echo "$PR_DETAILS" | jq --arg label "team-mmi" '.labels | map(.name) | contains([$label])')

# Check for reviewer team
REVIEWER_EXISTS=$(echo "$PR_DETAILS" | jq --arg team "$REVIEWER_TEAM" '.requested_reviewers | map(.login) | contains([$team])')

echo "Label Exists: $LABEL_EXISTS"
echo "Reviewer Exists: $REVIEWER_EXISTS"

# Check if either condition is met
if [[ "$LABEL_EXISTS" == "true" || "$REVIEWER_EXISTS" == "true" ]]; then
  echo "run_mmi_tests=true" > mmi_trigger.env
  echo "Conditions met: Label 'team-mmi' found or Reviewer '$REVIEWER_TEAM' assigned."
else
  echo "run_mmi_tests=false" > mmi_trigger.env
  echo "Conditions not met: Label 'team-mmi' not found and Reviewer '$REVIEWER_TEAM' not assigned."
fi
