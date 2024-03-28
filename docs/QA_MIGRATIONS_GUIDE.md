## QA Migrations Guide

### Upgrade with Migration
If you endeavor to test an upgrade from one version to another, remember that the files on the /dist folder are over-written whenever you run `yarn start`. We can use this to our advantage to directly support testing migrations. Migrations are needed to change top-level state data, this can be found in the browser's storage. This can look like removing specific keys/value pairs from state, changing objects to an array of objects, changing the name of a controller, etc. If you are intested in a specific migration that is in a pull request, then build the `develop` branch to initially load. If the migration is already merged in `develop`, get a commit before the migration was added to initially build.

Steps
  1. `git checkout master` so we are sure the PR we want to test is not in the branch
  2. `yarn` for dependancies
  3. `yarn start` to build, but please bear in mind that while this is more friendly for debugging that `yarn dist` will build with Lavamoat and provide a more production like experience
  4. Whenever the build is ready, load it to [Chrome](https://github.com/MetaMask/metamask-extension/blob/develop/docs/add-to-chrome.md) or [Firefox](https://github.com/MetaMask/metamask-extension/blob/develop/docs/add-to-firefox.md)
      ###### \* In order for the "Load unpacked" button to be shown developer mode needs to be enabled.
  5. Configure the wallet and alter settings as needed, ensure that the data the migration targets is present in the local storage once the state data has been initialized
          ![Chrome storage state](./assets/chrome-storage-local.png)
  6. Next checkout the feature branch you would like to upgrade to `git checkout YOURBRANCHNAMEHERE`
      ######  \* For migrations targeting specific features behind a feature flag add them appropriately to the `.metamaskrc` file before building.
  7. `yarn` for dependancies again
  8. `yarn start` or `yarn dist` to build
  9. Once the build is ready reload the extension by navigating to `about:debugging#/runtime/this-firefox` in Firefox or `chrome://extensions/` and be sure to tap the button to reload
  10. Complete post upgrade validation, and for migrations ensure that the data has been changed/deleted/etc as expected in state