#!/usr/bin/env bash
# Lists the changed APIs from sync-report.txt and records the fixture diff.
# Writes drift-readable.txt, drift-stat.txt, and e2e-api-mock-drift.diff, and
# adds a drift section to the job summary.
#
# Usage: e2e-api-mock-drift-report.sh <pull_request|weekly>

set -euo pipefail

TRIGGER="${1:?trigger required}"

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
    echo "These mocks are changed by this pull request and differ from the live APIs. The check fails until the update is on the branch."
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
