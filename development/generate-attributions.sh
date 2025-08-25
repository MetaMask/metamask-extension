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

  # Unset the root postinstall script to prevent it from installing devDependencies
  node ./unset-postinstall.js

  # Switching to the project directory explicitly, so that we can use paths
  # relative to the project root irrespective of where this script was run.
  cd "${PROJECT_DIRECTORY}"

  # Remove allow-scripts plugin.
  # Allow-scripts won't run correctly after a production-only install because the configuration
  # includes exact paths to each dependency, and those paths can change in a production-only
  # install because of the hoisting algorithm.
  # We don't need postinstall scripts to run in order to generate attributions anyway.
  yarn plugin remove @yarnpkg/plugin-allow-scripts

  # Instruct Yarn to only install production dependencies
  yarn workspaces focus --production

  # Change directory to the sub-project
  cd "${SCRIPT_DIRECTORY}/generate-attributions"

  # Generate attributions file
  yarn generate-attribution -o "${PROJECT_DIRECTORY}" -b "${PROJECT_DIRECTORY}"

  # Check if the script is running in a CI environment (GitHub Actions sets the CI variable to true)
  if [ -z "${CI:-}" ] || [ "${FORCE_CLEANUP:-}" = "true" ]; then
    # If not running in CI, restore the allow-scripts plugin and development dependencies.
    cd "${PROJECT_DIRECTORY}"
    git checkout -- .yarnrc.yml .yarn package.json
    yarn
  fi
}

main "$@"
