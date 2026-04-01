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
  # The SWC minifier emits source-map entries for empty lines inside template
  # literals (the minifier preserves string newlines but maps them as code).
  # source-map-explorer chokes on column references in zero-length lines.
  # Pad empty lines with a space so the tool can proceed; this only affects the
  # temp copy — the actual build output is untouched.
  # macOS sed requires '' after -i; GNU sed does not accept it.
  if sed --version 2>/dev/null | grep -q 'GNU'; then
    sed -i 's/^$/ /' "${temp_dir}/${module_name}.js"
  else
    sed -i '' 's/^$/ /' "${temp_dir}/${module_name}.js"
  fi
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
