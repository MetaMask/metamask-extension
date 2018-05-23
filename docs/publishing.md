# Publishing Guide

When publishing a new version of MetaMask, we follow this procedure:

## Preparation

We try to ensure certain criteria are met before deploying:

- Deploy early in the week, to give time for emergency responses to unforeseen bugs.
- Deploy early in the day, for the same reason.
- Make sure at least one member of the support team is "on duty" to watch for new user issues coming through the support system.
- Roll out incrementally when possible, to a small number of users first, and gradually to more users.

## Incrementing Version & Changelog

Version can be automatically incremented [using our bump script](./bumping-version.md).

npm run version:bump $BUMP_TYPE` where `$BUMP_TYPE` is one of `major`, `minor`, or `patch`.

## Building

While we develop on the main `develop` branch, our production version is maintained on the `master` branch.

With each pull request, the @MetaMaskBot will comment with a build of that new pull request, so after bumping the version on `develop`, open a pull request against `master`, and once the pull request is reviewed and merged, you can download those builds for publication.

## Publishing

1. Publish to chrome store.
2. Visit [the chrome developer dashboard](https://chrome.google.com/webstore/developer/dashboard?authuser=2).
3. Publish to [firefox addon marketplace](http://addons.mozilla.org/en-us/firefox/addon/ether-metamask).
4. Publish to [Opera store](https://addons.opera.com/en/extensions/details/metamask/).
5. Post on [Github releases](https://github.com/MetaMask/metamask-extension/releases) page.
6. Run the `npm run announce` script, and post that announcement in our public places.
