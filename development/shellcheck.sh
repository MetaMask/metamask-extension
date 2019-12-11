#!/usr/bin/env bash

# lint all *.sh files
shellcheck --version && find . -type f -name '*.sh' ! -path './node_modules/*' -print0 | xargs -0 shellcheck
# lint all .scripts in package.json
list=$(jq -r '.scripts | keys[] as $key | .[$key]' < package.json)
printf "#!/bin/bash\n%s\n" "$list" | shellcheck -
