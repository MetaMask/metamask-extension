#!/usr/bin/env bash

set -e
set -u
set -x
set -o pipefail

# use `improved-yarn-audit` since that allows for exclude
# exclusions are in .iyarc now
yarn run improved-yarn-audit \
    --ignore-dev-deps \
    --min-severity moderate \
    --fail-on-missing-exclusions

audit_status="$?"

if [[ "$audit_status" != 0 ]]
then
    count="$(yarn audit --level moderate --groups dependencies --json | tail -1 | jq '.data.vulnerabilities.moderate + .data.vulnerabilities.high + .data.vulnerabilities.critical')"
    printf "Audit shows %s moderate or high severity advisories _in the production dependencies_\n" "$count"
    exit 1
else
    printf "Audit shows _zero_ moderate or high severity advisories _in the production dependencies_\n"
fi
