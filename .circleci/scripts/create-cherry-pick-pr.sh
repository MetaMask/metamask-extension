#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# Takes in 3 args
# - 1 - Base PR Branch Name
# - 2 - Commit Hash
# - 3 - PR Number

BASE_PR_BRANCH_NAME="${1}"
COMMIT_HASH_TO_CHERRY_PICK="${2}"
PR_BRANCH_NAME="chore/cherry-pick-${3}"
PR_TITLE="chore: cherry-pick #${3}"
PR_BODY="This PR cherry-picks #${3}"

git config user.name "MetaMask Bot"
git config user.email "metamaskbot@users.noreply.github.com"

git checkout "${BASE_PR_BRANCH_NAME}"
git pull
git checkout -b "${PR_BRANCH_NAME}"
git cherry-pick "${COMMIT_HASH_TO_CHERRY_PICK}"

git push --set-upstream origin "${PR_BRANCH_NAME}"

gh pr create \
  --draft \
  --title "${PR_TITLE}" \
  --body "${PR_BODY}" \
  --head "${BASE_PR_BRANCH_NAME}"