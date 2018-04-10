# Welcome to MetaMask!

If you're submitting code to MetaMask, there are some simple things we'd appreciate you doing to help us stay organized!

## Submitting pull requests

Before taking the time to code and implement something, feel free to open an issue and discuss it! There may even be an issue already open, and together we may come up with a specific strategy before you take your precious time to write code.

### Tests

For any new programmatic functionality, we like unit tests when possible, so if you can keep your code cleanly isolated, please do add a test file to the `tests` folder.

### PR Format

We use [waffle](https://waffle.io/) for project management, and it will automatically keep us organized if you do one simple thing:

If this PR closes the issue, add the line `Fixes #$ISSUE_NUMBER`. Ex. For closing issue 418, include the line `Fixes #418`.

If it doesn't close the issue but addresses it partially, just include a reference to the issue number, like `#418`.

## Before Merging

Make sure you get a `:thumbsup`, `:+1`, or `LGTM` from another collaborator before merging.

## Before Closing Issues

Make sure the relevant code has been reviewed and merged.

### Work on Multiple Packages / Repositories

A very simple approach:

Create a folder somewhere manually called `node_modules`. For example in `~/node_modules`. Clone all of your git copies of modules that you want to work on into here, so for example:

```sh
mkdir node_modules
cd node_modules
git clone https://github.com/MetaMask/metamask-extension metamask
git clone https://github.com/MetaMask/provider-engine
# clone more modules you want to work on
# ensure to run "npm install" in each module
cd provider-engine
npm install
cd ../metamask-extension
npm install
```

In order to make metamask use the cloned `provider-engine` (on which you plan to work on), just delete the npm copy:

```
rm -rf ~/node_modules/metamask/node_modules/provider-engine
#WIN: rmdir node_modules/metamask/node_modules/provider-engine /S /Q
```

Any `require('provider-engine')` will traverse the directory-tree up, until it finds a `node_modules` folder which contains `provider-engine`.

If you change something within `~/node_modules/provider-engine`, then metamask will pick it up (you still have to use the usual `gulp dist` or `gulp dev` / refresh cycles).

Switching back to an npm copy of `provider-engine` is as easy as an `npm install provider-engine` inside `~/node_modules/metamask/`.

#### Further Information

[How "require" works](https://github.com/maxogden/art-of-node#how-require-works) in node.
