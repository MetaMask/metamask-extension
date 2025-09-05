#!/bin/bash

set -euo pipefail

semver="$SEMVER"

patch="${semver##*.}"
if [ "$patch" -gt 0 ]; then
  previous_ref=""
  echo "Hotfix detected (patch=$patch > 0): setting previous-version-ref to null (empty)."
  echo "previous_ref=${previous_ref}" >> "$GITHUB_OUTPUT"
  exit 0
fi

# Function to paginate and collect refs for a prefix
fetch_matching_refs() {
  local prefix="$1"
  local temp_file="$(mktemp)"
  local page=1
  echo "Fetching branches matching $prefix* (paginated)..." >&2
  while :; do
    echo "Fetching page $page for $prefix..." >&2
    resp="$(mktemp)"
    url="https://api.github.com/repos/${GITHUB_REPOSITORY}/git/matching-refs/heads/${prefix}?per_page=100&page=${page}"
    curl -sS -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3+json" "$url" -o "$resp"

    cat "$resp" >> "$temp_file"

    count=$(jq length "$resp")
    if [ "$count" -lt 100 ]; then
      break
    fi
    page=$((page + 1))
  done
  echo "$temp_file"
}

# Fetch for each prefix
version_v_file=$(fetch_matching_refs "Version-v")
release_file=$(fetch_matching_refs "release/")

# Combine and process: extract {name, semver} for matches, sort desc by semver
jq -s 'add | [ .[] | .ref | ltrimstr("refs/heads/") as $name | select($name | test("^Version-v[0-9]+\\.[0-9]+\\.[0-9]+$") or test("^release/[0-9]+\\.[0-9]+\\.[0-9]+$")) | {name: $name, semver: (if $name | test("^Version-v") then $name | ltrimstr("Version-v") else $name | ltrimstr("release/") end) } ] | sort_by( .semver | split(".") | map(tonumber) ) | reverse' "$version_v_file" "$release_file" > all_versions.json

# Filter to those with semver strictly lower than current and non-hotfix (patch==0)
jq --arg semver "$semver" '[ .[] | select( .semver as $v | $semver | split(".") as $c | $v | split(".") as $p | ( ($p[0] | tonumber) < ($c[0] | tonumber) or (($p[0] | tonumber) == ($c[0] | tonumber) and (($p[1] | tonumber) < ($c[1] | tonumber) or (($p[1] | tonumber) == ($c[1] | tonumber) and ($p[2] | tonumber) < ($c[2] | tonumber)))) ) and (($p[2] | tonumber) == 0) ) ]' all_versions.json > filtered_versions.json

# Select the highest lower: first in filtered list, fallback to main if none
if [ "$(jq length filtered_versions.json)" -eq 0 ]; then
  previous_ref="main"
  echo "No lower non-hotfix versions found, falling back to: ${previous_ref}"
else
  highest_lower="$(jq -r '.[0].semver' filtered_versions.json)"
  previous_ref="$(jq -r '.[0].name' filtered_versions.json)"
  echo "Selected highest lower non-hotfix version: ${highest_lower} (branch: ${previous_ref})"
fi
echo "previous_ref=${previous_ref}" >> "$GITHUB_OUTPUT"
