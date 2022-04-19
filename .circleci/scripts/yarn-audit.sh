#!/usr/bin/env bash

set -e
set -u
set -x
set -o pipefail

# use `improved-yarn-audit` since that allows for exclude
# exclude 1002401 until we remove use of 3Box, 1002581 until we can find a better solution
yarn run improved-yarn-audit --ignore-dev-deps --min-severity moderate --exclude GHSA-93q8-gq69-wqmw,GHSA-257v-vj4p-3w2h,GHSA-fwr7-v2mv-hh25
audit_status="$?"

# Use a bitmask to ignore INFO and LOW severity audit results
# See here: https://yarnpkg.com/lang/en/docs/cli/audit/
audit_status="$(( audit_status & 11100 ))"

if [[ "$audit_status" != 0 ]]
then
    count="$(yarn audit --level moderate --groups dependencies --json | tail -1 | jq '.data.vulnerabilities.moderate + .data.vulnerabilities.high + .data.vulnerabilities.critical')"
    printf "Audit shows %s moderate or high severity advisories _in the production dependencies_\n" "$count"
    exit 1
else
    printf "Audit shows _zero_ moderate or high severity advisories _in the production dependencies_\n"
fi
