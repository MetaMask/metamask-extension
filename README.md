# MetaMask Plugin [![Build Status](https://circleci.com/gh/MetaMask/metamask-plugin.svg?style=shield&circle-token=a1ddcf3cd38e29267f254c9c59d556d513e3a1fd)](https://circleci.com/gh/MetaMask/metamask-plugin)

## Developing Compatible Dapps

If you're a web dapp developer, we've got two types of guides for you:

- If you've never built a Dapp before, we've got a gentle introduction on [Developing Dapps with Truffle and MetaMask](https://blog.metamask.io/developing-for-metamask-with-truffle/).
- If you have a Dapp, and you want to ensure compatibility, [here is our guide on building MetaMask-compatible Dapps](https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md)

## Building locally

 - Install [Node.js](https://nodejs.org/en/) version 6.3.1 or later.
 - Install local dependencies with `npm install`.
 - Install gulp globally with `npm install -g gulp-cli`.
 - Build the project to the `./dist/` folder with `gulp build`.
 - Optionally, to rebuild on file changes, run `gulp dev`.
 - To package .zip files for distribution, run `gulp zip`, or run the full build & zip with `gulp dist`.

 Uncompressed builds can be found in `/dist`, compressed builds can be found in `/builds` once they're built.

## Installing Local Builds on Chrome

To install your locally built extension on Chrome, [follow this guide](http://stackoverflow.com/a/24577660/272576).

The built extension is stored in `./dist/chrome/`.

## Architecture

[![Architecture Diagram](./docs/architecture.png)][1]

## Development

```bash
npm install
npm start
```

## Build for Publishing

```bash
npm run dist
```

#### In Chrome

Open `Settings` > `Extensions`.

Check "Developer mode".

At the top, click `Load Unpacked Extension`.

Navigate to your `metamask-plugin/dist/chrome` folder.

Click `Select`.

You now have the plugin, and can click 'inspect views: background plugin' to view its dev console.

#### In Firefox

Go to the url `about:debugging`.

Click the button `Load Temporary Add-On`.

Select the file `dist/firefox/manifest.json`.

You can optionally enable debugging, and click `Debug`, for a console window that logs all of Metamask's processes to a single console.

If you have problems debugging, try connecting to the IRC channel `#webextensions` on `irc.mozilla.org`.

For longer questions, use the StackOverfow tag `firefox-addons`.

### Developing on UI Only

You can run `npm run ui`, and your browser should open a live-reloading demo version of the plugin UI.

Some actions will crash the app, so this is only for tuning aesthetics, but it allows live-reloading styles, which is a much faster feedback loop than reloading the full extension.

### Developing on UI with Mocked Background Process

You can run `npm run mock` and your browser should open a live-reloading demo version of the plugin UI, just like the `npm run ui`, except that it tries to actually perform all normal operations.

It does not yet connect to a real blockchain (this could be a good test feature later, connecting to a test blockchain), so only local operations work.

You can reset the mock ui at any time with the `Reset` button at the top of the screen.

### Developing on Dependencies

To enjoy the live-reloading that `gulp dev` offers while working on the `web3-provider-engine` or other dependencies:

 1. Clone the dependency locally.
 2. `npm install` in its folder.
 3. Run `npm link` in its folder.
 4. Run `npm link $DEP_NAME` in this project folder.
 5. Next time you `npm start` it will watch the dependency for changes as well!

### Running Tests

Requires `mocha` installed. Run `npm install -g mocha`.

Then just run `npm test`.

You can also test with a continuously watching process, via `npm run watch`.

You can run the linter by itself with `gulp lint`.

#### Writing Browser Tests

To write tests that will be run in the browser using QUnit, add your test files to `test/integration/lib`.

### Deploying the UI

 You must be authorized already on the MetaMask plugin.

 0. Update the version in `app/manifest.json` and the Changelog in `CHANGELOG.md`.
 1. Visit [the chrome developer dashboard](https://chrome.google.com/webstore/developer/dashboard?authuser=2).
 2. Run `gulp dist` (or `gulp zip` if you've already built)
 3. Upload the latest zip file from `builds/metamask-$PLATFORM-$VERSION.zip` as the updated package.

[1]: http://www.nomnoml.com/#view/%5B%3Cactor%3Euser%5D%0A%0A%5Bmetamask-ui%7C%0A%20%20%20%5Btools%7C%0A%20%20%20%20%20react%0A%20%20%20%20%20redux%0A%20%20%20%20%20thunk%0A%20%20%20%20%20ethUtils%0A%20%20%20%20%20jazzicon%0A%20%20%20%5D%0A%20%20%20%5Bcomponents%7C%0A%20%20%20%20%20app%0A%20%20%20%20%20account-detail%0A%20%20%20%20%20accounts%0A%20%20%20%20%20locked-screen%0A%20%20%20%20%20restore-vault%0A%20%20%20%20%20identicon%0A%20%20%20%20%20config%0A%20%20%20%20%20info%0A%20%20%20%5D%0A%20%20%20%5Breducers%7C%0A%20%20%20%20%20app%0A%20%20%20%20%20metamask%0A%20%20%20%20%20identities%0A%20%20%20%5D%0A%20%20%20%5Bactions%7C%0A%20%20%20%20%20%5BaccountManager%5D%0A%20%20%20%5D%0A%20%20%20%5Bcomponents%5D%3A-%3E%5Bactions%5D%0A%20%20%20%5Bactions%5D%3A-%3E%5Breducers%5D%0A%20%20%20%5Breducers%5D%3A-%3E%5Bcomponents%5D%0A%5D%0A%0A%5Bweb%20dapp%7C%0A%20%20%5Bui%20code%5D%0A%20%20%5Bweb3%5D%0A%20%20%5Bmetamask-inpage%5D%0A%20%20%0A%20%20%5B%3Cactor%3Eui%20developer%5D%0A%20%20%5Bui%20developer%5D-%3E%5Bui%20code%5D%0A%20%20%5Bui%20code%5D%3C-%3E%5Bweb3%5D%0A%20%20%5Bweb3%5D%3C-%3E%5Bmetamask-inpage%5D%0A%5D%0A%0A%5Bmetamask-background%7C%0A%20%20%5Bprovider-engine%5D%0A%20%20%5Bhooked%20wallet%20subprovider%5D%0A%20%20%5Bid%20store%5D%0A%20%20%0A%20%20%5Bprovider-engine%5D%3C-%3E%5Bhooked%20wallet%20subprovider%5D%0A%20%20%5Bhooked%20wallet%20subprovider%5D%3C-%3E%5Bid%20store%5D%0A%20%20%5Bconfig%20manager%7C%0A%20%20%20%20%5Brpc%20configuration%5D%0A%20%20%20%20%5Bencrypted%20keys%5D%0A%20%20%20%20%5Bwallet%20nicknames%5D%0A%20%20%5D%0A%20%20%0A%20%20%5Bprovider-engine%5D%3C-%5Bconfig%20manager%5D%0A%20%20%5Bid%20store%5D%3C-%3E%5Bconfig%20manager%5D%0A%5D%0A%0A%5Buser%5D%3C-%3E%5Bmetamask-ui%5D%0A%0A%5Buser%5D%3C%3A--%3A%3E%5Bweb%20dapp%5D%0A%0A%5Bmetamask-contentscript%7C%0A%20%20%5Bplugin%20restart%20detector%5D%0A%20%20%5Brpc%20passthrough%5D%0A%5D%0A%0A%5Brpc%20%7C%0A%20%20%5Bethereum%20blockchain%20%7C%0A%20%20%20%20%5Bcontracts%5D%0A%20%20%20%20%5Baccounts%5D%0A%20%20%5D%0A%5D%0A%0A%5Bweb%20dapp%5D%3C%3A--%3A%3E%5Bmetamask-contentscript%5D%0A%5Bmetamask-contentscript%5D%3C-%3E%5Bmetamask-background%5D%0A%5Bmetamask-background%5D%3C-%3E%5Bmetamask-ui%5D%0A%5Bmetamask-background%5D%3C-%3E%5Brpc%5D%0A


### Generate Development Visualization

This will generate a video of the repo commit history.

Install preqs:
```
brew install gource
brew install ffmpeg
```

From the repo dir, pipe `gource` into `ffmpeg`:
```
gource \
  --seconds-per-day .1 \
  --user-scale 1.5 \
  --default-user-image "./images/icon-512.png" \
  --viewport 1280x720 \
  --auto-skip-seconds .1 \
  --multi-sampling \
  --stop-at-end \
  --highlight-users \
  --hide mouse,progress \
  --file-idle-time 0 \
  --max-files 0  \
  --background-colour 000000 \
  --font-size 18 \
  --date-format "%b %d, %Y" \
  --highlight-dirs \
  --user-friction 0.1 \
  --title "MetaMask Development History" \
  --output-ppm-stream - \
  --output-framerate 30 \
  | ffmpeg -y -r 30 -f image2pipe -vcodec ppm -i - -b 65536K metamask-dev-history.mp4
```

## Generating Notices

To add a notice:
```
npm run generateNotice
```
Enter the body of your notice into the text editor that pops up, without including the body. Be sure to save the file before closing the window!
Afterwards, enter the title of the notice in the command line and press enter. Afterwards, add and commit the new changes made.

To delete a notice:
```
npm run deleteNotice
```
A list of active notices will pop up. Enter the corresponding id in the command line prompt and add and commit the new changes afterwards.

## Adding Custom Networks

To add another network to our dropdown menu, make sure the following files are adjusted properly:

```
app/scripts/config.js
app/scripts/lib/buy-eth-url.js
app/scripts/lib/config-manager.js
ui/app/app.js
ui/app/components/buy-button-subview.js
ui/app/components/drop-menu-item.js
ui/app/components/network.js
ui/app/components/transaction-list-item.js
ui/app/config.js
ui/app/css/lib.css
ui/lib/account-link.js
ui/lib/explorer-link.js
```

You will need:
+ The network ID
+ An RPC Endpoint url
+ An explorer link
+ CSS for the display icon
