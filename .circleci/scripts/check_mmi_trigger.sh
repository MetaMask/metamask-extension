#!/bin/bash
set -eo pipefail

# Ensure required environment variables are set
if [ -z "$CIRCLE_PULL_REQUEST" ] || [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: CIRCLE_PULL_REQUEST and GITHUB_TOKEN must be set."
  exit 1
fi

# Extract PR number from the pull request URL
PR_NUMBER=$(echo "$CIRCLE_PULL_REQUEST" | awk -F'/' '{print $NF}')

# Define repository details
REPO_OWNER="$CIRCLE_PROJECT_USERNAME"
REPO_NAME=$(basename "$CIRCLE_REPOSITORY_URL" .git)

# Fetch PR details and reviews using GitHub API
API_URL="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER"
PR_DETAILS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "$API_URL")
REVIEWS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "$API_URL/reviews")

# Check if the API requests were successful
if [[ -z "$PR_DETAILS" || -z "$REVIEWS" ]]; then
  echo "Error: Unable to fetch PR details or reviews from GitHub API."
  exit 1
fi

# Check for label 'team-mmi'
LABEL_EXISTS=$(jq -r '.labels[]? | select(.name == "team-mmi") | length > 0' <<< "$PR_DETAILS")

# Check for individual reviewer 'mmi'
REVIEWER_REQUESTED=$(jq -r '.requested_reviewers[]? | select(.login == "mmi") | length > 0' <<< "$PR_DETAILS")

# Check for team reviewer 'mmi'
TEAM_REQUESTED=$(jq -r '.requested_teams[]? | select(.slug == "mmi") | length > 0' <<< "$PR_DETAILS")

# Check if 'mmi' has submitted a review
REVIEWER_SUBMITTED=$(jq -r '.[]? | select(.user.login == "mmi") | length > 0' <<< "$REVIEWS")

# Evaluate whether to run MMI tests
if [[ "$LABEL_EXISTS" == "true" || "$REVIEWER_REQUESTED" == "true" || "$TEAM_REQUESTED" == "true" || "$REVIEWER_SUBMITTED" == "true" ]]; then
  echo "run_mmi_tests=true" > mmi_trigger.env

  # Log exactly which condition was met
  echo "Conditions met:"
  [[ "$LABEL_EXISTS" == "true" ]] && echo "- Label 'team-mmi' found."
  [[ "$REVIEWER_REQUESTED" == "true" ]] && echo "- Reviewer 'mmi' requested."
  [[ "$TEAM_REQUESTED" == "true" ]] && echo "- Team 'mmi' requested."
  [[ "$REVIEWER_SUBMITTED" == "true" ]] && echo "- Reviewer 'mmi' submitted a review."

else
  echo "run_mmi_tests=false" > mmi_trigger.env
  echo "Skipping MMI tests: No 'team-mmi' label found, and no 'MetaMask/mmi' reviewer assigned or review submitted."
fi
