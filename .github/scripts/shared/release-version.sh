#!/bin/bash

package_version_at() {
  git show "${1}:package.json" | jq -r '.version'
}

# A release bump moves main from X.Y.0 to the next minor (X.Y+1.0) or the next major (X+1.0.0).
is_release_bump() {
  local old="$1"
  local new="$2"
  [[ "$old" =~ ^([0-9]+)\.([0-9]+)\.0$ ]] || return 1
  local major="${BASH_REMATCH[1]}"
  local minor="${BASH_REMATCH[2]}"
  [ "$new" = "${major}.$((minor + 1)).0" ] || [ "$new" = "$((major + 1)).0.0" ]
}
