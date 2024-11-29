#!/bin/bash
set -eo pipefail

# Ensure required environment variables are set
if [ -z "$CIRCLE_PULL_REQUEST" ] || [ -z "$GITHUB_TOKEN" ]; then
  echo "This appears to be a fork or required environment variables are not set."
  echo "Skipping MMI tests."
  echo "run_mmi_tests=false" > mmi_trigger.env
  exit 0
fi

if [[ $CIRCLE_BRANCH = 'main' || $CIRCLE_BRANCH = 'stable' || $CIRCLE_BRANCH =~ ^Version-v[0-9.]* ]]; then
  echo "Long-running branch detected, running MMI tests."
  echo "run_mmi_tests=true" > mmi_trigger.env
  exit 0
fi

# Extract PR number from the pull request URL
PR_NUMBER=$(echo "$CIRCLE_PULL_REQUEST" | awk -F'/' '{print $NF}')

# Define repository details
REPO_OWNER="$CIRCLE_PROJECT_USERNAME"
REPO_NAME=$(basename "$CIRCLE_REPOSITORY_URL" .git)

# Fetch PR details using GitHub API
PR_DETAILS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER")

# Fetch submitted reviews
SUBMITTED_REVIEWS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER/reviews")

# Check for label 'team-mmi'
LABEL_EXISTS=$(jq -r '.labels[]? | select(.name == "team-mmi") | length > 0' <<< "$PR_DETAILS")

# Check for individual reviewer 'mmi'
REVIEWER_REQUESTED=$(jq -r '.requested_reviewers[]? | select(.login == "mmi") | length > 0' <<< "$PR_DETAILS")

# Check for team reviewer 'mmi'
TEAM_REQUESTED=$(jq -r '.requested_teams[]? | select(.slug == "mmi") | length > 0' <<< "$PR_DETAILS")

# Check if 'mmi' submitted a review
REVIEWER_SUBMITTED=$(jq -r '.[]? | select(.user.login == "mmi") | length > 0' <<< "$SUBMITTED_REVIEWS")

# Determine which condition was met and trigger tests if needed
if [[ "$LABEL_EXISTS" == "true" || "$REVIEWER_REQUESTED" == "true" || "$TEAM_REQUESTED" == "true" || "$REVIEWER_SUBMITTED" == "true" ]]; then
  echo "run_mmi_tests=true" > mmi_trigger.env

  # Log exactly which condition was met
  echo "Conditions met:"
  if [[ "$LABEL_EXISTS" == "true" ]]; then
    echo "- Label 'team-mmi' found."
  fi
  if [[ "$REVIEWER_REQUESTED" == "true" ]]; then
    echo "- Reviewer 'mmi' requested."
  fi
  if [[ "$TEAM_REQUESTED" == "true" ]]; then
    echo "- Team 'mmi' requested."
  fi
  if [[ "$REVIEWER_SUBMITTED" == "true" ]]; then
    echo "- Reviewer 'mmi' submitted a review."
  fi
else
  echo "run_mmi_tests=false" > mmi_trigger.env
  echo "Skipping MMI tests: Neither the 'team-mmi' label was found nor a reviewer from the 'MetaMask/mmi' team was assigned."
fi
