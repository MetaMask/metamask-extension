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

  # Remove a specific plugin from the plugins array using a node script
  # This is a workaround for the issue where the `allow-scripts` plugin which is defined in devDependencies
  # is not required for the attribution generation script
  node -e "const fs = require('fs');
           const targetPath = '.yarn/plugins/@yarnpkg/plugin-allow-scripts.cjs';
           const lines = fs.readFileSync('$tmp', 'utf8').split('\n');
           let inPluginsSection = false;
           let inTargetPluginBlock = false;
           const result = [];
           lines.forEach(line => {
             if (line.trim() === 'plugins:') {
               inPluginsSection = true;  // Start of plugins section
               result.push(line);
               return;
             }
             if (inPluginsSection) {
               if (line.trim().startsWith('- path:') && line.includes(targetPath)) {
                 inTargetPluginBlock = true;  // Found the target plugin block, start skipping
                 return;
               }
               if (line.trim().startsWith('- path:')) {
                 inTargetPluginBlock = false;  // Found a new plugin block, ensure not skipping this
               }
               if (line.trim() === '' || !line.startsWith(' ')) {
                 inPluginsSection = false;  // Likely end of plugins section
                 inTargetPluginBlock = false;
               }
               if (!inTargetPluginBlock) {
                 result.push(line);  // Add line if not in target plugin block
               }
             } else {
               result.push(line);  // Outside plugins section, always add line
             }
           });
           fs.writeFileSync('.yarnrc.yml', result.join('\n'));"

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
