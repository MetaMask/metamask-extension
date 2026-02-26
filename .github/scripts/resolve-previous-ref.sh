#!/bin/bash

set -euo pipefail

# Ensure SEMVER is provided via environment and assign
semver="${SEMVER:?SEMVER environment variable must be set}"

patch="${semver##*.}"
if [ "$patch" -gt 0 ]; then
  previous_ref="null"
  echo "Hotfix detected (patch=$patch > 0): setting previous-version-ref to 'null' (string)."
  echo "previous_ref=${previous_ref}" >> "$GITHUB_OUTPUT"
  exit 0
fi

# Function to paginate and collect refs for a prefix (narrow prefixes only)
fetch_matching_refs() {
  local prefix="$1"
  local temp_file
  temp_file="$(mktemp)"
  local page=1
  echo "Fetching branches matching $prefix* (paginated)..." >&2
  while :; do
    echo "Fetching page $page for $prefix..." >&2
    local resp
    resp="$(mktemp)"
    url="https://api.github.com/repos/${GITHUB_REPOSITORY}/git/matching-refs/heads/${prefix}?per_page=100&page=${page}"
    curl -sS -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3+json" "$url" -o "$resp"

    cat "$resp" >> "$temp_file"

    local count
    count=$(jq length "$resp")
    if [ "$count" -lt 100 ]; then
      break
    fi
    page=$((page + 1))
    if [ "$page" -gt 100 ]; then
      echo "Error: Exceeded maximum pagination limit (100 pages) while fetching refs for prefix '$prefix'. This may indicate too many matching branches or an API issue." >&2
      exit 1
    fi
  done
  echo "$temp_file"
}

# Try immediate previous minor within the same major by direct branch existence checks
major="${semver%%.*}"
rest_minor_patch="${semver#*.}"
minor="${rest_minor_patch%%.*}"

if ! [[ "$major" =~ ^[0-9]+$ && "$minor" =~ ^[0-9]+$ ]]; then
  echo "Error: Unable to parse major/minor from semver: $semver" >&2
  exit 1
fi

if [ "$minor" -gt 0 ]; then
  cand_minor=$((minor - 1))
  while [ "$cand_minor" -ge 0 ]; do
    candidate="release/${major}.${cand_minor}.0"
    echo "Checking for branch: ${candidate}" >&2
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/${GITHUB_REPOSITORY}/branches/${candidate}")
    if [ "$http_code" = "200" ]; then
      echo "Found previous non-hotfix branch: ${candidate}" >&2
      echo "previous_ref=${candidate}" >> "$GITHUB_OUTPUT"
      exit 0
    fi
    cand_minor=$((cand_minor - 1))
  done
fi

# Fallback: move to previous major and select highest non-hotfix (patch==0)
prev_major=$((major - 1))
if [ "$prev_major" -lt 0 ]; then
  echo "Error: No previous major available for semver: $semver" >&2
  exit 1
fi

release_file=$(fetch_matching_refs "release/${prev_major}.")

# From the fetched list for the previous major, keep only patch==0 branches and pick the highest
jq -s '[ (add // [])
        | .[]
        | .ref
        | ltrimstr("refs/heads/") as $name
        | select($name | test("^release/[0-9]+\\.[0-9]+\\.[0-9]+$"))
        | { name: $name, semver: ($name | ltrimstr("release/")) }
      ]
      | map(select(.semver | split(".")[2] == "0"))
      | sort_by( .semver | split(".") | map(tonumber) )
      | reverse' "$release_file" > filtered_versions.json

if [ "$(jq length filtered_versions.json)" -eq 0 ]; then
  echo "Error: No non-hotfix branches found for previous major ${prev_major}." >&2
  exit 1
else
  selected_semver="$(jq -r '.[0].semver' filtered_versions.json)"
  previous_ref="$(jq -r '.[0].name' filtered_versions.json)"
  echo "Selected previous major highest non-hotfix: ${selected_semver} (branch: ${previous_ref})"
  echo "previous_ref=${previous_ref}" >> "$GITHUB_OUTPUT"
fi
