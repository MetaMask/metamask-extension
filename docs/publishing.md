# Publishing Guide

When publishing a new version of MetaMask, we follow this procedure:

## Incrementing Version & Changelog

Version can be automatically incremented [using our bump script](./bumping-version.md).

npm run version:bump $BUMP_TYPE` where `$BUMP_TYPE` is one of `major`, `minor`, or `patch`.

## Publishing

1. `npm run dist` to generate the latest build.
2. Publish to chrome store.
  - Visit [the chrome developer dashboard](https://chrome.google.com/webstore/developer/dashboard?authuser=2).
3. Publish to firefox addon marketplace.
4. Post on Github releases page.
5. `npm run announce`, post that announcement in our public places.

