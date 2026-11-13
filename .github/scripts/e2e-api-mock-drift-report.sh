#!/usr/bin/env bash
# Lists the changed APIs from sync-report.txt and records the fixture diff.
# Writes drift-readable.txt, drift-stat.txt, and e2e-api-mock-drift.diff, and
# adds a drift section to the job summary.
#
# Usage: e2e-api-mock-drift-report.sh <pull_request|weekly> [sync-exit-code]
# On a pull request, exit code 4 means the drift is only in mocks the pull
# request did not change, so it does not fail the check.

set -euo pipefail

TRIGGER="${1:?trigger required}"
SYNC_EXIT="${2:-1}"

while IFS= read -r line || [ -n "${line}" ]; do
  [ -z "${line}" ] && continue
  # Only changed-API lines: "<id> <url>: <change>".
  case "${line}" in
    'skip '* | 'info '* | 'refused '*) continue ;;
  esac
  case "${line}" in
    *' https://'* | *' http://'*) ;;
    *) continue ;;
  esac
  ident="${line%% *}"
  rest="${line#* }"
  change="${rest##*: }"
  url="${rest%": ${change}"}"
  short="${url%%\?*}"
  short="${short#https://}"
  short="${short#http://}"
  if [ "${#short}" -gt 96 ]; then
    short="${short:0:48}...${short: -36}"
  fi
  printf -- "- **%s** (\`%s\`): %s\n" "${ident}" "${short}" "${change}"
done < sync-report.txt > drift-readable.txt

git diff --stat > drift-stat.txt
git diff > e2e-api-mock-drift.diff

{
  echo "### E2E API mock drift"
  echo
  cat drift-readable.txt
  echo
  if [ "${TRIGGER}" = "pull_request" ]; then
    if [ "${SYNC_EXIT}" = "4" ]; then
      echo "None of these mocks is changed by this pull request, so this drift does not fail the check. The suggestions let you apply it here, or the weekly sync will."
    else
      echo "Drift in mocks this pull request changed fails the check until the update is on the branch. Drift in other mocks is listed under Other API drift and does not fail it."
    fi
    echo
    echo "Run \`yarn test:e2e:sync-api-mocks\` and commit the result. The full diff is the \`e2e-api-mock-drift\` artifact."
  else
    echo "The weekly job commits this onto \`sync/e2e-api-mocks\`."
  fi
  echo
  echo '```'
  cat drift-stat.txt
  echo '```'
} >> "${GITHUB_STEP_SUMMARY}"
