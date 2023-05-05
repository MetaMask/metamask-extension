## QA Migrations Guide

### Upgrade
If you endeavor to test an upgrade from one version to another, remember that the files on the /dist folder are over-written whenever you `yarn start`. We can use this to directly support testing upgrades.

Steps
  1. `git checkout master` so we are sure the PR we want to test is not in the branch
  2. `yarn` for dependancies
  3. `yarn start` to build, but please bear in mind that while this is more friendly for debugging that `yarn dist` will build with Lavamoat and provide a more production like experience
  4. Whenever the build is ready, load it to [Chrome](https://github.com/MetaMask/metamask-extension/blob/develop/docs/add-to-chrome.md) or [Firefox](https://github.com/MetaMask/metamask-extension/blob/develop/docs/add-to-firefox.md)
  5. Configure the wallet and alter settings as needed
  6. Next checkout the feature branch you would like to upgrade to `git checkout YOURBRANCHNAMEHERE`
  7. `yarn` for dependancies again
  8. `yarn start` or `yarn dist` to build
  9. Once the build is ready reload the extension by navigating to `about:debugging#/runtime/this-firefox` in Firefox or `chrome://extensions/` and be sure to tap the button to reload
  10. Complete post upgrade validation
  

### Migration
Migrations are needed to change top-level state data, this can be found in the browser's storage. This can look like removing specific keys/value pairs from state, changing objects to an array of objects, changing the name of a controller, etc.

Steps
  1. Create a new MetaMask directory\* folder locally with the source files before the migration (all files in .../metamask-extension/dist/chrome), and load it as an unpacked extension in Chrome\*. If the migration is in a pull request, then build the `develop` branch to load. If the migration is already in `develop`, get a commit before the migration was added to build.

      ![Load unpacked extension to chrome](./assets/load-build-chrome.gif)

      ######  \* For migrations targeting specific features behind a feature flag add them appropriately to the `.metamaskrc` file before building.
      ###### \* In order for the "Load unpacked" button to be shown developer mode needs to be enabled.

  2. Once the build has been loaded and state data has been initialized, ensure that the data in question that the migration targets is present in the local storage data.

      ![Chrome storage state](./assets/chrome-storage-local.png)

  3. To trigger the migration a build with the migration will need to replace the files in the directory where the extension is loaded from, and refresh the extension.

      ![gif of replacing files and reloading the extension](./assets/folder-file-replacement-build.gif)

  4. Ensure that the data has been changed/deleted/etc.
