#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# Generate LavaMoat policies for the extension background script for each build
# type.
# ATTN: This may tax your device when running it locally.

function run_sequentially() {
  WRITE_AUTO_POLICY=1 yarn build scripts:prod --policy-only &&
  WRITE_AUTO_POLICY=1 yarn build scripts:prod --policy-only --build-type beta &&
  WRITE_AUTO_POLICY=1 yarn build scripts:prod --policy-only --build-type flask
}

function run_parallel() {
  concurrently --kill-others-on-fail -n main,beta,flask \
    "WRITE_AUTO_POLICY=1 yarn build scripts:prod --policy-only" \
    "WRITE_AUTO_POLICY=1 yarn build scripts:prod --policy-only --build-type beta" \
    "WRITE_AUTO_POLICY=1 yarn build scripts:prod --policy-only --build-type flask"
}

if [[ $# -gt 0 ]]
  then run_parallel
  else run_sequentially
fi
