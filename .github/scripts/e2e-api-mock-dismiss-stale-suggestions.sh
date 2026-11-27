#!/usr/bin/env bash
# Deletes suggestion comments from earlier sync reviews (marked
# <!-- e2e-api-mock-sync-review -->). Only a confirmed clean sync (exit 0)
# may do this. A fetch failure or a refused write has no suggest-plan.json
# either, and must not treat a live suggestion review as stale.
#
# Env: GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, EXIT.
# EXIT must be 0. Optional file: suggest-plan.json, with a .hash to keep.

set -euo pipefail

if [ "${EXIT:-}" != "0" ]; then
  echo "skip stale suggestion cleanup: exit ${EXIT:-unset} did not confirm a clean sync" >&2
  exit 0
fi

MARKER="<!-- e2e-api-mock-sync-review -->"
KEEP_HASH=""
if [ -f suggest-plan.json ]; then
  KEEP_HASH="$(jq -r '.hash // empty' suggest-plan.json)"
fi

gh api --paginate --slurp "repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/reviews?per_page=100" \
  | jq 'add // []' > pr-reviews.json

jq -r --arg marker "${MARKER}" --arg hash "${KEEP_HASH}" '
  .[]
  | select(.user.login == "github-actions[bot]")
  | select((.body // "") | contains($marker))
  | select($hash == "" or ((.body // "") | contains($hash) | not))
  | .id
' pr-reviews.json > stale-review-ids.txt

if [ ! -s stale-review-ids.txt ]; then
  exit 0
fi

gh api --paginate --slurp "repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/comments?per_page=100" \
  | jq 'add // []' > pr-review-comments.json

while IFS= read -r REVIEW_ID || [ -n "${REVIEW_ID}" ]; do
  [ -z "${REVIEW_ID}" ] && continue
  jq -r --arg id "${REVIEW_ID}" '
    .[] | select((.pull_request_review_id | tostring) == $id) | .id
  ' pr-review-comments.json > stale-comment-ids.txt
  while IFS= read -r COMMENT_ID || [ -n "${COMMENT_ID}" ]; do
    [ -z "${COMMENT_ID}" ] && continue
    gh api --method DELETE "repos/${GITHUB_REPOSITORY}/pulls/comments/${COMMENT_ID}"
  done < stale-comment-ids.txt
  # COMMENT reviews often cannot be dismissed. The suggestions are the comments.
  gh api --method PUT "repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/reviews/${REVIEW_ID}/dismissals" \
    -f message="Superseded by a later API mock sync." \
    -f event="DISMISS" || true
done < stale-review-ids.txt
