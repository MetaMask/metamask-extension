# MetaMask Browser Extension

Hey! We are hiring a Senior Mobile Engineer! Apply here: https://boards.greenhouse.io/consensys/jobs/1990589
---

[![Build Status](https://circleci.com/gh/MetaMask/metamask-extension.svg?style=shield&circle-token=a1ddcf3cd38e29267f254c9c59d556d513e3a1fd)](https://circleci.com/gh/MetaMask/metamask-extension) [![Coverage Status](https://coveralls.io/repos/github/MetaMask/metamask-extension/badge.svg?branch=master)](https://coveralls.io/github/MetaMask/metamask-extension?branch=master)

---
### MetaMask Browser help pages
* [CHANGELOG](https://github.com/restarian/metamask-extension/blob/develop/docs/CHANGELOG.md)
* [MISSION](https://github.com/restarian/metamask-extension/blob/develop/docs/MISSION.md)
* [QA Guide](https://github.com/restarian/metamask-extension/blob/develop/docs/QA_Guide.md)
* [README](https://github.com/restarian/metamask-extension/blob/develop/docs/README.md)
* [USER AGREEMENT](https://github.com/restarian/metamask-extension/blob/develop/docs/USER_AGREEMENT.md)
* [Add-to-chrome](https://github.com/restarian/metamask-extension/blob/develop/docs/add-to-chrome.md)
* [Add-to-firefox](https://github.com/restarian/metamask-extension/blob/develop/docs/add-to-firefox.md)
* [Adding-new-networks](https://github.com/restarian/metamask-extension/blob/develop/docs/adding-new-networks.md)
* [Bumping version](https://github.com/restarian/metamask-extension/blob/develop/docs/bumping_version.md)
* [Creating-metrics-events](https://github.com/restarian/metamask-extension/blob/develop/docs/creating-metrics-events.md)
* [Design-system](https://github.com/restarian/metamask-extension/blob/develop/docs/design-system.md)
* [Developing-on-deps](https://github.com/restarian/metamask-extension/blob/develop/docs/developing-on-deps.md)
* [Limited site access](https://github.com/restarian/metamask-extension/blob/develop/docs/limited_site_access.md)
* [Multi vault planning](https://github.com/restarian/metamask-extension/blob/develop/docs/multi_vault_planning.md)
* [Porting to new environment](https://github.com/restarian/metamask-extension/blob/develop/docs/porting_to_new_environment.md)
* [Publishing](https://github.com/restarian/metamask-extension/blob/develop/docs/publishing.md)
* [Secret-preferences](https://github.com/restarian/metamask-extension/blob/develop/docs/secret-preferences.md)
* [Send-screen-QA-checklist](https://github.com/restarian/metamask-extension/blob/develop/docs/send-screen-QA-checklist.md)
* [Sensitive-release](https://github.com/restarian/metamask-extension/blob/develop/docs/sensitive-release.md)
* [State dump](https://github.com/restarian/metamask-extension/blob/develop/docs/state_dump.md)
* **Synopsis**
* [Translating-guide](https://github.com/restarian/metamask-extension/blob/develop/docs/translating-guide.md)
* [Trezor-emulator](https://github.com/restarian/metamask-extension/blob/develop/docs/trezor-emulator.md)
* Components
  * [Account-menu](https://github.com/restarian/metamask-extension/blob/develop/docs/components/account-menu.md)

---

You can find the latest version of MetaMask on [our official website](https://metamask.io/). For help using MetaMask, visit our [User Support Site](https://metamask.zendesk.com/hc/en-us).

MetaMask supports Firefox, Google Chrome, and Chromium-based browsers. We recommend using the latest available browser version.

For up to the minute news, follow our [Twitter](https://twitter.com/metamask_io) or [Medium](https://medium.com/metamask) pages.

To learn how to develop MetaMask-compatible applications, visit our [Developer Docs](https://metamask.github.io/metamask-docs/).

To learn how to contribute to the MetaMask project itself, visit our [Internal Docs](https://github.com/MetaMask/metamask-extension/tree/develop/docs).

## Building locally

- Install [Node.js](https://nodejs.org) version 10
    - If you are using [nvm](https://github.com/creationix/nvm#installation) (recommended) running `nvm use` will automatically choose the right node version for you.
- Install [Yarn](https://yarnpkg.com/en/docs/install)
- Install dependencies: `yarn`
- Build the project to the `./dist/` folder with `yarn dist`.
- Optionally, to start a development build (e.g. with logging and file watching) run `yarn start` instead.
    - To start the [React DevTools](https://github.com/facebook/react-devtools) and [Redux DevTools Extension](http://extension.remotedev.io)
      alongside the app, use `yarn start:dev`.
      - React DevTools will open in a separate window; no browser extension is required
      - Redux DevTools will need to be installed as a browser extension. Open the Redux Remote Devtools to access Redux state logs. This can be done by either right clicking within the web browser to bring up the context menu, expanding the Redux DevTools panel and clicking Open Remote DevTools OR clicking the Redux DevTools extension icon and clicking Open Remote DevTools.
        - You will also need to check the "Use custom (local) server" checkbox in the Remote DevTools Settings, using the default server configuration (host `localhost`, port `8000`, secure connection checkbox unchecked)

Uncompressed builds can be found in `/dist`, compressed builds can be found in `/builds` once they're built.

