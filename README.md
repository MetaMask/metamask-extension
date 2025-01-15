# MetaMask Browser Extension

You can find the latest version of MetaMask on [our official website](https://metamask.io/). For help using MetaMask, visit our [User Support Site](https://support.metamask.io/).

For [general questions](https://community.metamask.io/c/learn/26), [feature requests](https://community.metamask.io/c/feature-requests-ideas/13), or [developer questions](https://community.metamask.io/c/developer-questions/11), visit our [Community Forum](https://community.metamask.io/).

MetaMask supports Firefox, Google Chrome, and Chromium-based browsers. We recommend using the latest available browser version.

For up to the minute news, follow us on [X](https://x.com/MetaMask).

To learn how to develop MetaMask-compatible applications, visit our [Developer Docs](https://metamask.github.io/metamask-docs/).

To learn how to contribute to the MetaMask codebase, visit our [Contributor Docs](https://github.com/MetaMask/contributor-docs).

To learn how to contribute to the MetaMask Extension project itself, visit our [Extension Docs](https://github.com/MetaMask/metamask-extension/tree/main/docs).

## GitHub Codespaces quickstart

As an alternative to building on your local machine, there is a new option to get a development environment up and running in less than 5 minutes by using GitHub Codespaces. Please note that there is a [Limited Free Monthly Quota](https://docs.github.com/en/billing/managing-billing-for-github-codespaces/about-billing-for-github-codespaces), and after that GitHub will start charging you.

_Note: You are billed for both time spent running, and for storage used_

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/MetaMask/metamask-extension?quickstart=1)

1. Start by clicking the button above
2. A new browser tab will open with a remote version of Visual Studio Code (this will take a few minutes to load)
3. A "Simple Browser" will open inside the browser with noVNC -- click Connect
   - Optional steps:
     - Click the button at the upper-right of the Simple Browser tab to open the noVNC window in its own tab
     - Open the noVNC sidebar on the left, click the gear icon, change the Scaling Mode to Remote Resizing
4. Wait about 20 extra seconds on the first launch, for the scripts to finish
5. Right-click on the noVNC desktop to launch Chrome or Firefox with MetaMask pre-installed
6. Change some code, then run `yarn start` to build in dev mode
7. After a minute or two, it will finish building, and you can see your changes in the noVNC desktop

### Tips to keep your Codespaces usage lower

- You are billed for both time spent running, and for storage used
- Codespaces pause after 30 minutes of inactivity, and auto-delete after 30 days of inactivity
- You can manage your Codespaces here: https://github.com/codespaces
  - You may want to manually pause them before the 30 minute timeout
  - If you have several idle Codespaces hanging around for several days, you can quickly run out of storage quota. You should delete the ones you do not plan to use anymore, and probably keep only 1 or 2 in the long-term. It's also possible to re-use old Codespaces and switch the branch, instead of creating new ones and deleting the old ones.

### Codespaces on a fork

If you are not a MetaMask Internal Developer, or are otherwise developing on a fork, the default Infura key will be on the Free Plan and have very limited requests per second. If you want to use your own Infura key, follow the `.metamaskrc` and `INFURA_PROJECT_ID` instructions in the section [Building on your local machine](#building-on-your-local-machine).

## Building on your local machine

- Install [Node.js](https://nodejs.org) version 20
  - If you are using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (recommended) running `nvm use` will automatically choose the right node version for you.
- Enable Corepack by executing the command `corepack enable` within the metamask-extension project. Corepack is a utility included with Node.js by default. It manages Yarn on a per-project basis, using the version specified by the `packageManager` property in the project's package.json file. Please note that modern releases of [Yarn](https://yarnpkg.com/getting-started/install) are not intended to be installed globally or via npm.
- Duplicate `.metamaskrc.dist` within the root and rename it to `.metamaskrc` by running `cp .metamaskrc{.dist,}`.
  - Replace the `INFURA_PROJECT_ID` value with your own personal [Infura API Key](https://docs.infura.io/networks/ethereum/how-to/secure-a-project/project-id).
    - If you don't have an Infura account, you can create one for free on the [Infura website](https://app.infura.io/register).
  - If debugging MetaMetrics, you'll need to add a value for `SEGMENT_WRITE_KEY` [Segment write key](https://segment.com/docs/connections/find-writekey/), see [Developing on MetaMask - Segment](./development/README.md#segment).
  - If debugging unhandled exceptions, you'll need to add a value for `SENTRY_DSN` [Sentry Dsn](https://docs.sentry.io/product/sentry-basics/dsn-explainer/), see [Developing on MetaMask - Sentry](./development/README.md#sentry).
  - Optionally, replace the `PASSWORD` value with your development wallet password to avoid entering it each time you open the app.
- Run `yarn install` to install the dependencies.
- Build the project to the `./dist/` folder with `yarn dist` (for Chromium-based browsers) or `yarn dist:mv2` (for Firefox)

  - Optionally, to create a development build you can instead run `yarn start` (for Chromium-based browsers) or `yarn start:mv2` (for Firefox)
  - Uncompressed builds can be found in `/dist`, compressed builds can be found in `/builds` once they're built.
  - See the [build system readme](./development/build/README.md) for build system usage information.

- Follow these instructions to verify that your local build runs correctly:
  - [How to add custom build to Chrome](./docs/add-to-chrome.md)
  - [How to add custom build to Firefox](./docs/add-to-firefox.md)

## Git Hooks

To get quick feedback from our shared code quality fitness functions before committing the code, you can install our git hooks with Husky.

`$ yarn githooks:install`

You can read more about them in our [testing documentation](./docs/testing.md#fitness-functions-measuring-progress-in-code-quality-and-preventing-regressions-using-custom-git-hooks).

If you are using VS Code and are unable to make commits from the source control sidebar due to a "command not found" error, try these steps from the [Husky docs](https://typicode.github.io/husky/troubleshooting.html#command-not-found).

## Contributing

### Development builds

To start a development build (e.g. with logging and file watching) run `yarn start`.

#### Development build with wallet state

You can start a development build with a preloaded wallet state, by adding `TEST_SRP='<insert SRP here>'` and `PASSWORD='<insert wallet password here>'` to the `.metamaskrc` file. Then you have the following options:

1. Start the wallet with the default fixture flags, by running `yarn start:with-state`.
2. Check the list of available fixture flags, by running `yarn start:with-state --help`.
3. Start the wallet with custom fixture flags, by running `yarn start:with-state --FIXTURE_NAME=VALUE` for example `yarn start:with-state --withAccounts=100`. You can pass as many flags as you want. The rest of the fixtures will take the default values.

#### Development build with Webpack

You can also start a development build using the `yarn webpack` command, or `yarn webpack --watch`. This uses an alternative build system that is much faster, but not yet production ready. See the [Webpack README](./development/webpack/README.md) for more information.

#### React and Redux DevTools

To start the [React DevTools](https://github.com/facebook/react-devtools), run `yarn devtools:react` with a development build installed in a browser. This will open in a separate window; no browser extension is required.

To start the [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools/tree/main/extension):

- Install the package `remotedev-server` globally (e.g. `yarn global add remotedev-server`)
- Install the Redux Devtools extension.
- Open the Redux DevTools extension and check the "Use custom (local) server" checkbox in the Remote DevTools Settings, using the default server configuration (host `localhost`, port `8000`, secure connection checkbox unchecked).

Then run the command `yarn devtools:redux` with a development build installed in a browser. This will enable you to use the Redux DevTools extension to inspect MetaMask.

To create a development build and run both of these tools simultaneously, run `yarn start:dev`.

#### Test Dapp

[This test site](https://metamask.github.io/test-dapp/) can be used to execute different user flows.

### Running Unit Tests and Linting

Run unit tests and the linter with `yarn test`. To run just unit tests, run `yarn test:unit`.

You can run the linter by itself with `yarn lint`, and you can automatically fix some lint problems with `yarn lint:fix`. You can also run these two commands just on your local changes to save time with `yarn lint:changed` and `yarn lint:changed:fix` respectively.

For Jest debugging guide using Node.js, see [docs/tests/jest.md](docs/tests/jest.md).

### Running E2E Tests

Our e2e test suite can be run on either Firefox or Chrome. Here's how to get started with e2e testing:

#### Preparing a Test Build

Before running e2e tests, ensure you've run `yarn install` to download dependencies. Next, you'll need a test build. You have 3 options:

1. Use `yarn download-builds:test` to quickly download and unzip test builds for Chrome and Firefox into the `./dist/` folder. This method is fast and convenient for standard testing.
2. Create a custom test build: for testing against different build types, use `yarn build:test`. This command allows you to generate test builds for various types, including:
   - `yarn build:test` for main build
   - `yarn build:test:flask` for flask build
   - `yarn build:test:mmi` for mmi build
   - `yarn build:test:mv2` for mv2 build
3. Start a test build with live changes: `yarn start:test` is particularly useful for development. It starts a test build that automatically recompiles application code upon changes. This option is ideal for iterative testing and development. This command also allows you to generate test builds for various types, including:
   - `yarn start:test` for main build
   - `yarn start:test:flask` for flask build
   - `yarn start:test:mv2` for mv2 build

Note: The `yarn start:test` command (which initiates the testDev build type) has LavaMoat disabled for both the build system and the application, offering a streamlined testing experience during development. On the other hand, `yarn build:test` enables LavaMoat for enhanced security in both the build system and application, mirroring production environments more closely.

#### Running Tests

Once you have your test build ready, choose the browser for your e2e tests:

- For Firefox, run `yarn test:e2e:firefox`.
  - Note: If you are running Firefox as a snap package on Linux, ensure you enable the appropriate environment variable: `FIREFOX_SNAP=true yarn test:e2e:firefox`
- For Chrome, run `yarn test:e2e:chrome`.

These scripts support additional options for debugging. Use `--help`to see all available options.

#### Running a single e2e test

Single e2e tests can be run with `yarn test:e2e:single test/e2e/tests/TEST_NAME.spec.js` along with the options below.

```console
  --browser           Set the browser to be used; specify 'chrome', 'firefox', 'all'
                      or leave unset to run on 'all' by default.
                                                          [string] [default: 'all']
  --debug             Run tests in debug mode, logging each driver interaction
                                                         [boolean] [default: true]
  --retries           Set how many times the test should be retried upon failure.
                                                              [number] [default: 0]
  --leave-running     Leaves the browser running after a test fails, along with
                      anything else that the test used (ganache, the test dapp,
                      etc.)                              [boolean] [default: false]
  --update-snapshot   Update E2E test snapshots
                                             [alias: -u] [boolean] [default: false]
```

For example, to run the `account-details` tests using Chrome, with debug logging and with the browser set to remain open upon failure, you would use:
`yarn test:e2e:single test/e2e/tests/account-menu/account-details.spec.js --browser=chrome --leave-running`

#### Running e2e tests against specific feature flag

While developing new features, we often use feature flags. As we prepare to make these features generally available (GA), we remove the feature flags. Existing feature flags are listed in the `.metamaskrc.dist` file. To execute e2e tests with a particular feature flag enabled, it's necessary to first generate a test build with that feature flag activated. There are two ways to achieve this:

- To enable a feature flag in your local configuration, you should first ensure you have a `.metamaskrc` file copied from `.metamaskrc.dist`. Then, within your local `.metamaskrc` file, you can set the desired feature flag to true. Following this, a test build with the feature flag enabled can be created by executing `yarn build:test`.

- Alternatively, for enabling a feature flag directly during the test build creation, you can pass the parameter as true via the command line. For instance, activating the MULTICHAIN feature flag can be done by running `MULTICHAIN=1 yarn build:test` or `MULTICHAIN=1 yarn start:test` . This method allows for quick adjustments to feature flags without altering the `.metamaskrc` file.

Once you've created a test build with the desired feature flag enabled, proceed to run your tests as usual. Your tests will now run against the version of the extension with the specific feature flag activated. For example:
`yarn test:e2e:single test/e2e/tests/account-menu/account-details.spec.js --browser=chrome`

This approach ensures that your e2e tests accurately reflect the user experience for the upcoming GA features.

#### Running specific builds types e2e test

Different build types have different e2e tests sets. In order to run them look in the `package.json` file. You will find:

```console
    "test:e2e:chrome:mmi": "SELENIUM_BROWSER=chrome node test/e2e/run-all.js --mmi",
    "test:e2e:chrome:snaps": "SELENIUM_BROWSER=chrome node test/e2e/run-all.js --snaps",
    "test:e2e:firefox": "SELENIUM_BROWSER=firefox node test/e2e/run-all.js",
```

#### Note: Running MMI e2e tests

When running e2e on an MMI build you need to know that there are 2 separated set of tests:

- MMI runs a subset of MetaMask's e2e tests. To facilitate this, we have appended the `@no-mmi` tags to the names of those tests that are not applicable to this build type.
- MMI runs another specific set of e2e legacy tests which are better documented [here](test/e2e/mmi/README.md)

### Changing dependencies

Whenever you change dependencies (adding, removing, or updating, either in `package.json` or `yarn.lock`), there are various files that must be kept up-to-date.

- `yarn.lock`:
  - Run `yarn` again after your changes to ensure `yarn.lock` has been properly updated.
  - Run `yarn lint:lockfile:dedupe:fix` to remove duplicate dependencies from the lockfile.
- The `allow-scripts` configuration in `package.json`
  - Run `yarn allow-scripts auto` to update the `allow-scripts` configuration automatically. This config determines whether the package's install/postinstall scripts are allowed to run. Review each new package to determine whether the install script needs to run or not, testing if necessary.
  - Unfortunately, `yarn allow-scripts auto` will behave inconsistently on different platforms. macOS and Windows users may see extraneous changes relating to optional dependencies.
- The LavaMoat policy files
  - If you are a MetaMask team member and your PR is on a repository branch, you can use the bot command `@metamaskbot update-policies` to ask the MetaMask bot to automatically update the policies for you.
  - If your PR is from a fork, you can ask a MetaMask team member to help with updating the policy files.
  - Manual update instructions: The _tl;dr_ is to run `yarn lavamoat:auto` to update these files, but there can be devils in the details:
    - There are two sets of LavaMoat policy files:
      - The production LavaMoat policy files (`lavamoat/browserify/*/policy.json`), which are re-generated using `yarn lavamoat:webapp:auto`. Add `--help` for usage.
        - These should be regenerated whenever the production dependencies for the webapp change.
      - The build system LavaMoat policy file (`lavamoat/build-system/policy.json`), which is re-generated using `yarn lavamoat:build:auto`.
        - This should be regenerated whenever the dependencies used by the build system itself change.
    - Whenever you regenerate a policy file, review the changes to determine whether the access granted to each package seems appropriate.
    - Unfortunately, `yarn lavamoat:auto` will behave inconsistently on different platforms.
      macOS and Windows users may see extraneous changes relating to optional dependencies.
    - If you keep getting policy failures even after regenerating the policy files, try regenerating the policies after a clean install by doing:
      - `rm -rf node_modules/ && yarn && yarn lavamoat:auto`
    - Keep in mind that any kind of dynamic import or dynamic use of globals may elude LavaMoat's static analysis.
      Refer to the LavaMoat documentation or ask for help if you run into any issues.
- The Attributions file
  - If you are a MetaMask team member and your PR is on a repository branch, you can use the bot command `@metamaskbot update-attributions` to ask the MetaMask bot to automatically update the attributions file for you.
  - Manual update: run `yarn attributions:generate`.

## Architecture

- [Visual of the controller hierarchy and dependencies as of summer 2022.](https://gist.github.com/rekmarks/8dba6306695dcd44967cce4b6a94ae33)
- [Visual of the entire codebase.](https://mango-dune-07a8b7110.1.azurestaticapps.net/?repo=metamask%2Fmetamask-extension)

[![Architecture Diagram](./docs/architecture.png)][1]

## Other Docs

- [How to add a new translation to MetaMask](./docs/translating-guide.md)
- [Publishing Guide](./docs/publishing.md)
- [How to use the TREZOR emulator](./docs/trezor-emulator.md)
- [Developing on MetaMask](./development/README.md)
- [How to generate a visualization of this repository's development](./development/gource-viz.sh)
- [How to add new confirmations](./docs/confirmations.md)
- [Browser support guidelines](./docs/browser-support.md)

## Dapp Developer Resources

- [Extend MetaMask's features w/ MetaMask Snaps.](https://docs.metamask.io/snaps/)
- [Prompt your users to add and switch to a new network.](https://docs.metamask.io/wallet/how-to/add-network/)
- [Change the logo that appears when your dapp connects to MetaMask.](https://docs.metamask.io/wallet/how-to/display/icon/)

[1]: http://www.nomnoml.com/#view/%5B%3Cactor%3Euser%5D%0A%0A%5Bmetamask-ui%7C%0A%20%20%20%5Btools%7C%0A%20%20%20%20%20react%0A%20%20%20%20%20redux%0A%20%20%20%20%20thunk%0A%20%20%20%20%20ethUtils%0A%20%20%20%20%20jazzicon%0A%20%20%20%5D%0A%20%20%20%5Bcomponents%7C%0A%20%20%20%20%20app%0A%20%20%20%20%20account-detail%0A%20%20%20%20%20accounts%0A%20%20%20%20%20locked-screen%0A%20%20%20%20%20restore-vault%0A%20%20%20%20%20identicon%0A%20%20%20%20%20config%0A%20%20%20%20%20info%0A%20%20%20%5D%0A%20%20%20%5Breducers%7C%0A%20%20%20%20%20app%0A%20%20%20%20%20metamask%0A%20%20%20%20%20identities%0A%20%20%20%5D%0A%20%20%20%5Bactions%7C%0A%20%20%20%20%20%5BbackgroundConnection%5D%0A%20%20%20%5D%0A%20%20%20%5Bcomponents%5D%3A-%3E%5Bactions%5D%0A%20%20%20%5Bactions%5D%3A-%3E%5Breducers%5D%0A%20%20%20%5Breducers%5D%3A-%3E%5Bcomponents%5D%0A%5D%0A%0A%5Bweb%20dapp%7C%0A%20%20%5Bui%20code%5D%0A%20%20%5Bweb3%5D%0A%20%20%5Bmetamask-inpage%5D%0A%20%20%0A%20%20%5B%3Cactor%3Eui%20developer%5D%0A%20%20%5Bui%20developer%5D-%3E%5Bui%20code%5D%0A%20%20%5Bui%20code%5D%3C-%3E%5Bweb3%5D%0A%20%20%5Bweb3%5D%3C-%3E%5Bmetamask-inpage%5D%0A%5D%0A%0A%5Bmetamask-background%7C%0A%20%20%5Bprovider-engine%5D%0A%20%20%5Bhooked%20wallet%20subprovider%5D%0A%20%20%5Bid%20store%5D%0A%20%20%0A%20%20%5Bprovider-engine%5D%3C-%3E%5Bhooked%20wallet%20subprovider%5D%0A%20%20%5Bhooked%20wallet%20subprovider%5D%3C-%3E%5Bid%20store%5D%0A%20%20%5Bconfig%20manager%7C%0A%20%20%20%20%5Brpc%20configuration%5D%0A%20%20%20%20%5Bencrypted%20keys%5D%0A%20%20%20%20%5Bwallet%20nicknames%5D%0A%20%20%5D%0A%20%20%0A%20%20%5Bprovider-engine%5D%3C-%5Bconfig%20manager%5D%0A%20%20%5Bid%20store%5D%3C-%3E%5Bconfig%20manager%5D%0A%5D%0A%0A%5Buser%5D%3C-%3E%5Bmetamask-ui%5D%0A%0A%5Buser%5D%3C%3A--%3A%3E%5Bweb%20dapp%5D%0A%0A%5Bmetamask-contentscript%7C%0A%20%20%5Bplugin%20restart%20detector%5D%0A%20%20%5Brpc%20passthrough%5D%0A%5D%0A%0A%5Brpc%20%7C%0A%20%20%5Bethereum%20blockchain%20%7C%0A%20%20%20%20%5Bcontracts%5D%0A%20%20%20%20%5Baccounts%5D%0A%20%20%5D%0A%5D%0A%0A%5Bweb%20dapp%5D%3C%3A--%3A%3E%5Bmetamask-contentscript%5D%0A%5Bmetamask-contentscript%5D%3C-%3E%5Bmetamask-background%5D%0A%5Bmetamask-background%5D%3C-%3E%5Bmetamask-ui%5D%0A%5Bmetamask-background%5D%3C-%3E%5Brpc%5D%0A
