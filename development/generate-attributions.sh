#!/usr/bin/env bash

set -e
set -u
set -o pipefail

SCRIPT_DIRECTORY=$(cd "${BASH_SOURCE[0]%/*}" && pwd)
PROJECT_DIRECTORY=$(cd "${SCRIPT_DIRECTORY}" && cd ../ && pwd)

# Generate attributions
#
# Generate the file `attribution.txt`, which is a list of packages that we use
# along with their licenses. This should include only production dependencies.
main() {
  # Switching to the project directory explicitly, so that we can use paths
  # relative to the project root irrespective of where this script was run.
  cd "${PROJECT_DIRECTORY}"

  # Save .yarnrc.yml to temp file
  local tmp=".yarnrc.tmp.yml"
  cp ".yarnrc.yml" "$tmp"

  # Convert YAML to JSON using Python and then use jq to remove the plugins section
  yarnrc=$(python -c 'import sys, yaml, json; print(json.dumps(yaml.safe_load(sys.stdin.read())))' <"$tmp" | jq 'del(.plugins)')
  echo "$yarnrc" >".yarnrc.yml"

  # Run yarn command
  yarn workspaces focus --production

  # Restore original .yarnrc.yml
  mv "$tmp" ".yarnrc.yml"

  # Change directory to the sub-project
  cd "${PROJECT_DIRECTORY}/development/generate-attributions"

  # Install sub-project that just contains attribution generation package
  # so that it can be used without installing `devDependencies` in root.
  yarn && yarn allow-scripts

  # Generate attribution file
  yarn generate-attribution -o "${PROJECT_DIRECTORY}" -b "${PROJECT_DIRECTORY}"
}

main "$@"
