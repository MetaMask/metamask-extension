#!/usr/bin/env bash
# Posts or updates the one sync comment (marked <!-- e2e-api-mock-sync -->).
#
# Env: GH_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID, PR_NUMBER, and COMMIT_SHA
# (the weekly sync commit; empty on a pull request). On a pull request,
# suggest-mode.txt and suggest-reason.txt come from the suggestion review step.

set -euo pipefail

MARKER="<!-- e2e-api-mock-sync -->"
READABLE="$(cat drift-readable.txt)"
STAT="$(cat drift-stat.txt)"
DIFF=""
MODE="fallback"
REASON=""
if [ -f suggest-mode.txt ]; then
  MODE="$(cat suggest-mode.txt)"
fi
if [ -f suggest-reason.txt ]; then
  REASON="$(cat suggest-reason.txt)"
fi

SHAPE_ONLY='The change is shape-only: existing values stay, new fields are placeholders, and removed fields are dropped.'
# Sync exit 4: drift only in mocks this pull request did not change.
if [ "${EXIT:-1}" = "4" ]; then
  STATUS='None of these mocks is changed by this pull request, so the check does not fail. Applying the suggestions here is optional; the weekly sync picks it up otherwise.'
else
  STATUS='The check fails until the drift in mocks this pull request changed is on the branch. Drift in other mocks is included and does not fail it.'
fi
if [ -n "${COMMIT_SHA:-}" ]; then
  INTRO="$(printf '%s\n\n%s\n\n%s' \
    "Updated the E2E API mocks on this pull request. ${SHAPE_ONLY}" \
    "Commit: https://github.com/${GITHUB_REPOSITORY}/commit/${COMMIT_SHA}" \
    'Workflow runs on this pull request stay waiting until a maintainer approves them. The commit was pushed with the workflow token.')"
elif [ "${MODE}" = "suggestions" ]; then
  INTRO="$(printf '%s\n\n%s\n\n%s' \
    'E2E API mocks differ from the live response shapes. This run did not push.' \
    'A review on this pull request has suggestions. Use Commit suggestion, or batch them and commit them together. That commit is authored by you, so the other checks are not held for approval.' \
    "${SHAPE_ONLY} ${STATUS}")"
else
  INTRO="$(printf '%s\n\n%s\n\n%s' \
    'E2E API mocks differ from the live response shapes. This run did not push.' \
    "${REASON:-GitHub cannot attach a suggestion for this drift. Run \`yarn test:e2e:sync-api-mocks\` locally and commit the result.} ${STATUS}" \
    "${SHAPE_ONLY} The full diff is the \`e2e-api-mock-drift\` artifact on this run: https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}")"
  bytes="$(wc -c < e2e-api-mock-drift.diff)"
  if [ "${bytes}" -le 20000 ]; then
    DIFF="$(cat e2e-api-mock-drift.diff)"
  fi
fi

jq -n \
  --arg marker "${MARKER}" \
  --arg intro "${INTRO}" \
  --arg report "${READABLE}" \
  --arg stat "${STAT}" \
  --arg diff "${DIFF}" \
  '{body: (
    $marker + "\n" + $intro + "\n\n" + $report +
    (if $stat == "" then "" else "\n\n```\n" + $stat + "\n```\n" end) +
    (if $diff == "" then "" else "\n<details>\n<summary>Fixture diff</summary>\n\n```diff\n" + $diff + "\n```\n</details>\n" end)
  )}' \
  > comment.json

COMMENT_ID="$(gh api --paginate "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" --jq ".[] | select(.body | contains(\"${MARKER}\")) | .id" | head -n 1)"
if [ -n "${COMMENT_ID}" ]; then
  gh api --method PATCH "repos/${GITHUB_REPOSITORY}/issues/comments/${COMMENT_ID}" --input comment.json
else
  gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" --input comment.json
fi
