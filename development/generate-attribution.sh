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

  # Remove the .yarn/plugins/@yarnpkg/plugin-allow-scripts.cjs plugin from yarnrc.
  # This is a workaround for an issue where the allow scripts plugin, defined in devDependencies,
  # is not needed for the attribution generation script.
  node "${SCRIPT_DIRECTORY}/generate-attribution/remove-yarn-allow-scripts-plugin.js" "${PROJECT_DIRECTORY}/${tmp}"

  yarn workspaces focus --production

  # Restore original .yarnrc.yml
  mv "$tmp" ".yarnrc.yml"

  # Change directory to the sub-project
  cd "${SCRIPT_DIRECTORY}/generate-attribution"

  # Install sub-project that just contains attribution generation package
  # so that it can be used without installing `devDependencies` in root.
  yarn && yarn allow-scripts

  # Generate attribution file
  yarn generate-attribution -o "${PROJECT_DIRECTORY}" -b "${PROJECT_DIRECTORY}"
}

main "$@"
