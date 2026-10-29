#!/usr/bin/env bash
# Pin geckodriver 0.36.0 for Firefox Selenium runs.
#
# geckodriver 0.37.0 breaks some e2e tests as the dapp can't detect the wallet.
# We pin the version as a temporary patch until migration to Playwright (in progress).
# This sets GECKODRIVER_PATH, which `test/e2e/webdriver/firefox.js` reads first;
# the firefox.js fallback handles local runs. Remove this script (and the
# firefox.js pin) once a fixed geckodriver release is verified.
# See: https://github.com/mozilla/geckodriver/releases/tag/v0.37.0
#
# Used by:
# - .github/workflows/run-e2e.yml
# - .github/workflows/run-benchmarks.yml
#
# Expected env (GitHub Actions):
# - RUNNER_TEMP
# - GITHUB_ENV

set -euo pipefail

GECKO_VERSION="${GECKO_VERSION:-0.36.0}"
GECKO_DIR="${RUNNER_TEMP:?RUNNER_TEMP is required}/geckodriver-${GECKO_VERSION}"

mkdir -p "$GECKO_DIR"
curl -fsSL "https://github.com/mozilla/geckodriver/releases/download/v${GECKO_VERSION}/geckodriver-v${GECKO_VERSION}-linux64.tar.gz" \
  | tar -xz -C "$GECKO_DIR"
chmod +x "$GECKO_DIR/geckodriver"

echo "GECKODRIVER_PATH=$GECKO_DIR/geckodriver" >> "${GITHUB_ENV:?GITHUB_ENV is required}"
"$GECKO_DIR/geckodriver" --version
