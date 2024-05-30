#!/usr/bin/env bash

set -e
set -u
set -o pipefail

SCRIPT_DIRECTORY=$(cd "${BASH_SOURCE[0]%/*}" && pwd)
PROJECT_DIRECTORY=$(cd "${SCRIPT_DIRECTORY}" && cd ../ && pwd)

# Generate attributions file
#
# Generate the file `attribution.txt`, which is a list of packages that we use
# along with their licenses. This should include only production dependencies.
main() {
  # Change directory to the sub-project
  cd "${SCRIPT_DIRECTORY}/generate-attributions"

  yarn && yarn allow-scripts

  # Add the `node_modules/.bin` directory to the PATH
  # This is necessary for `yarn workspaces focus --production` to work, as it
  # requires the allow-script executable in bin, which is used by the
  # `plugin-allow-scripts.cjs` defined in the .yarnrc file
  export PATH="${SCRIPT_DIRECTORY}/generate-attributions/node_modules/.bin:${PATH}"

  # Switching to the project directory explicitly, so that we can use paths
  # relative to the project root irrespective of where this script was run.
  cd "${PROJECT_DIRECTORY}"

  # Instruct Yarn to only install production dependencies
  yarn workspaces focus --production

  # Change directory to the sub-project
  cd "${SCRIPT_DIRECTORY}/generate-attributions"

  # Generate attributions file
  yarn generate-attribution -o "${PROJECT_DIRECTORY}" -b "${PROJECT_DIRECTORY}"

  # Check if the script is running in a CI environment (GitHub Actions sets the CI variable to true)
  if [ -z "${CI:-}" ]; then
    # If not running in CI, prompt to restore development dependencies
    echo "To restore development dependencies, please run 'yarn install'"
  fi
}

main "$@"
