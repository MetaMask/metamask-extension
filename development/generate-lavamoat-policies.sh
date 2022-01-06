#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# Generate LavaMoat policies for the extension background script for each build
# type.
# ATTN: This may tax your device when running it locally.
concurrently --kill-others-on-fail -n main,beta,flask \
  "WRITE_AUTO_POLICY=1 yarn build scripts:prod --policy-only" \
  "WRITE_AUTO_POLICY=1 yarn build scripts:prod --policy-only --build-type beta" \
  "WRITE_AUTO_POLICY=1 yarn build scripts:prod --policy-only --build-type flask"
