#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

BUILD_DEST="./build-artifacts/build-viz/"

# prepare artifacts dir
mkdir -p "${BUILD_DEST}"

# generate lavamoat debug configs
yarn lavamoat:debug:build
yarn lavamoat:debug:webapp --parallel=false

# generate entries for all present policy dirs under lavamoat/browserify
# static entry for build-system
POLICY_DIR_NAMES=$(find lavamoat/browserify -maxdepth 1 -mindepth 1 -type d -printf '%f ')

POLICY_FILE_PATHS_JSON=$(echo -n "${POLICY_DIR_NAMES}" \
  | jq --raw-input --slurp --indent 0 '
    rtrimstr(" ")
    | split(" ")
    | map({
        "key": .,
        "value": {
          "debug":  ("lavamoat/browserify/"+.+"/policy-debug.json"),
          "override":"lavamoat/browserify/policy-override.json",
          "primary":("lavamoat/browserify/"+.+"/policy.json")
        }
      })
    | from_entries
    |."build-system"= {
        "debug":   "lavamoat/build-system/policy-debug.json",
        "override":"lavamoat/build-system/policy-override.json",
        "primary": "lavamoat/build-system/policy.json"
      }'
)
# generate viz
# shellcheck disable=SC2086
yarn lavamoat-viz --dest "${BUILD_DEST}" --policyNames build-system ${POLICY_DIR_NAMES} --policyFilePathsJson "${POLICY_FILE_PATHS_JSON}"
