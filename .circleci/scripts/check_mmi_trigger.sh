#!/bin/bash
set -eo pipefail

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

# Fetch submitted reviews
SUBMITTED_REVIEWS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER/reviews")

# Check for label using jq
LABEL_EXISTS=$(jq -r '.labels[]? | select(.name == "team-mmi") | length > 0' <<< "$PR_DETAILS")

# Check for reviewer team in requested reviewers
REVIEWER_REQUESTED=$(jq -r '.requested_reviewers[]? | select(.login == "mmi") | length > 0' <<< "$PR_DETAILS")

# Check for reviewer team in submitted reviews
REVIEWER_SUBMITTED=$(jq -r '.[]? | select(.user.login == "mmi") | length > 0' <<< "$SUBMITTED_REVIEWS")

echo "Label Exists: $LABEL_EXISTS"
echo "Reviewer Requested: $REVIEWER_REQUESTED"
echo "Reviewer Submitted: $REVIEWER_SUBMITTED"

# Check if any condition is met
if [[ "$LABEL_EXISTS" == "true" || "$REVIEWER_REQUESTED" == "true" || "$REVIEWER_SUBMITTED" == "true" ]]; then
  echo "run_mmi_tests=true" > mmi_trigger.env
  echo "Conditions met: Label 'team-mmi' found or Reviewer 'mmi' assigned/submitted."
else
  echo "run_mmi_tests=false" > mmi_trigger.env
  echo "Conditions not met: Label 'team-mmi' not found and Reviewer 'mmi' not assigned/submitted."
fi

# Debug: Print all reviewers
echo "All Requested Reviewers: "
jq -r '.requested_reviewers[].login' <<< "$PR_DETAILS"
echo "All Submitted Reviews:"
jq -r '.[].user.login' <<< "$SUBMITTED_REVIEWS"
