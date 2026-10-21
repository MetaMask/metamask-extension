#!/bin/bash

is_numeric_semver() {
  [[ "${1:-}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
}

package_version_from_json() {
  python3 -c 'import json,sys; print(json.load(sys.stdin)["version"])'
}

next_minor_version() {
  local version="$1"
  if ! is_numeric_semver "$version"; then
    echo "Invalid semver: ${version:-<empty>}" >&2
    return 1
  fi

  local major minor patch
  IFS=. read -r major minor patch <<< "$version"
  if [ "$patch" -ne 0 ]; then
    echo "Version ${version} is not a minor release (patch must be 0)." >&2
    return 1
  fi

  echo "${major}.$((minor + 1)).0"
}

replace_package_version() {
  local file="$1"
  local next="$2"
  if ! is_numeric_semver "$next"; then
    echo "Refusing to write invalid semver: ${next:-<empty>}" >&2
    return 1
  fi

  python3 - "$file" "$next" <<'PY'
import pathlib
import re
import sys

path, nxt = sys.argv[1], sys.argv[2]
file = pathlib.Path(path)
text = file.read_text()
updated, count = re.subn(
    r'("version"\s*:\s*")\d+\.\d+\.\d+(")',
    lambda match: f"{match.group(1)}{nxt}{match.group(2)}",
    text,
    count=1,
)
if count != 1:
    raise SystemExit(f"expected to replace one version field in {path}")
file.write_text(updated)
PY
}
