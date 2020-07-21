#!/usr/bin/env bash

set -e
set -u
set -x
set -o pipefail

if [[ ${CI:-} == true ]]
then
  mkdir -p ~/.local/bin
  curl -sSL 'https://github.com/koalaman/shellcheck/releases/download/stable/shellcheck-stable.linux.x86_64.tar.xz' \
  | tar -xJ
  mv shellcheck-stable/* ~/.local/bin/
  rmdir shellcheck-stable
fi

shellcheck --version
# lint all *.sh files
find . -type f -name '*.sh' ! -path './node_modules/*' -print0 | xargs -0 shellcheck
# lint all .scripts in package.json
# shellcheck disable=SC2016
list=$(jq -r '.scripts | keys[] as $key | .[$key]' < package.json)
printf "#!/bin/bash\n%s\n" "$list" | shellcheck -
