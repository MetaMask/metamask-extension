#!/usr/bin/env bash

# Runs a sequence of webpack builds on one runner (one checkout, one webpack:tsc).
# Stages each output under ci-build-artifacts/<build-name>/ for upload steps.
#
# Keep build commands synchronized with:
# * .github/scripts/bundle.sh
# * .github/workflows/publish-release-from-release-head.yml

set -euo pipefail

GROUP="${1:?Usage: ci-run-build-group.sh <mv3|mv2|beta-flask>}"
STAGING_ROOT="${CI_BUILD_STAGING_ROOT:-ci-build-artifacts}"

run_build() {
  local build_name="$1"
  local build_command="$2"
  local bundle_analyzer="${3:-false}"
  local run_mozilla_lint="${4:-false}"

  export ENABLE_MV3=true
  if [[ "$build_name" == *mv2* ]]; then
    export ENABLE_MV3=false
  fi

  export IS_FLASK_BUILD=false
  if [[ "$build_name" == *flask* ]]; then
    export IS_FLASK_BUILD=true
  fi

  export IS_BETA_BUILD=false
  if [[ "$build_name" == *beta* ]]; then
    export IS_BETA_BUILD=true
  fi

  export IS_EXPERIMENTAL_BUILD=false
  if [[ "$build_name" == *experimental* ]]; then
    export IS_EXPERIMENTAL_BUILD=true
  fi

  echo "=== Building ${build_name} ==="

  if [[ "$bundle_analyzer" == "true" ]]; then
    eval "${build_command} --bundleAnalyzer"
  else
    eval "${build_command}"
  fi

  yarn validate-source-maps

  if [[ "$run_mozilla_lint" == "true" ]]; then
    yarn mozilla-lint
  fi

  local staging_dir="${STAGING_ROOT}/${build_name}"
  mkdir -p "${staging_dir}"

  cp -R dist builds "${staging_dir}/"

  if [[ "$bundle_analyzer" == "true" && -f dist/report.html ]]; then
    mkdir -p "${staging_dir}/bundle-analyzer"
    cp dist/report.html "${staging_dir}/bundle-analyzer/report.html"
  fi

  rm -rf dist builds
}

case "$GROUP" in
  mv3)
    run_build build-dist-webpack "yarn webpack:lavamoat:build --zip --stats" true false
    run_build build-test-webpack "yarn build:test --zip" false false
    run_build build-test-flask-webpack "yarn build:test:flask --zip" false false
    ;;
  mv2)
    run_build build-dist-mv2-webpack "yarn webpack:lavamoat:build:mv2 --zip" false true
    run_build build-test-mv2-webpack "yarn build:test:mv2 --zip" false false
    run_build build-test-flask-mv2-webpack "yarn build:test:flask:mv2 --zip" false false
    ;;
  beta-flask)
    run_build build-beta-webpack "yarn webpack:lavamoat:build --type beta --zip" false false
    run_build build-beta-mv2-webpack "yarn webpack:lavamoat:build:mv2 --type beta --zip" false true
    run_build build-flask-webpack "yarn webpack:lavamoat:build --type flask --zip" false false
    run_build build-flask-mv2-webpack "yarn webpack:lavamoat:build:mv2 --type flask --zip" false true
    ;;
  *)
    echo "Unknown build group: ${GROUP}" >&2
    exit 1
    ;;
esac
