#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

function generate_sourcemap() {
  local temp_dir="${1}"; shift
  local module_name="${1}"; shift

  cp "dist/chrome/${module_name}.js" "${temp_dir}/"
  cp "dist/sourcemaps/${module_name}.js.map" "${temp_dir}/"
  printf '//# sourceMappingURL=%s.js.map' "${module_name}" >> "${temp_dir}/${module_name}.js"
  yarn source-map-explorer "${temp_dir}/${module_name}.js" "${temp_dir}/${module_name}.js.map" --html "build-artifacts/source-map-explorer/${module_name}.html"
}

function main() {
  mkdir -p build-artifacts/source-map-explorer

  local temp_dir
  temp_dir="$(mktemp -d)"

  for file in dist/sourcemaps/*.js.map; do
    [[ -e $file ]] || (echo 'Failed to find any JavaScript modules' && exit 1)
    local filename
    filename="$(basename "${file}")"
    local module_name
    module_name="${filename%.js.map}"
    generate_sourcemap "${temp_dir}" "${module_name}"
  done
}

main
