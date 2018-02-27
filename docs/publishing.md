# Publishing Guide

When publishing a new version of MetaMask, we follow this procedure:

## Incrementing Version & Changelog

 You must be authorized already on the MetaMask plugin.

1. Update the version in `app/manifest.json` and the Changelog in `CHANGELOG.md`.
2. Visit [the chrome developer dashboard](https://chrome.google.com/webstore/developer/dashboard?authuser=2).

## Publishing

1. `npm run dist` to generate the latest build.
2. Publish to chrome store.
3. Publish to firefox addon marketplace.
4. Post on Github releases page.
5. `npm run announce`, post that announcement in our public places.

